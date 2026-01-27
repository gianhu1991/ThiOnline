import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Cho phép làm bài thi công khai (không cần đăng nhập) nếu bài thi là public
    const user = await getJWT(request)
    
    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: {
        examQuestions: {
          include: {
            question: true,
          },
        },
      },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Không tìm thấy bài thi' }, { status: 404 })
    }

    // Kiểm tra trạng thái isActive (tắt/mở thủ công)
    if (!exam.isActive) {
      return NextResponse.json({ 
        error: 'Bài thi đã bị tắt. Vui lòng liên hệ quản trị viên để mở lại.',
      }, { status: 400 })
    }

    // Kiểm tra quyền truy cập bài thi và lấy maxAttempts từ assignment
    let maxAttempts = exam.maxAttempts // Mặc định dùng maxAttempts của exam
    let assignment = null
    
    // Nếu bài thi là public, cho phép làm không cần đăng nhập
    if (exam.isPublic) {
      // Nếu có user đăng nhập, kiểm tra xem có assignment không để lấy maxAttempts
      if (user) {
        assignment = await prisma.examAssignment.findUnique({
          where: {
            examId_userId: {
              examId: params.id,
              userId: user.userId,
            },
          },
        })
        
        if (assignment && assignment.maxAttempts !== null) {
          maxAttempts = assignment.maxAttempts
        }
      }
    } else {
      // Nếu bài thi không public, cần đăng nhập
      if (!user) {
        return NextResponse.json({ 
          error: 'Bài thi này chỉ dành cho người dùng được gán. Vui lòng đăng nhập.',
        }, { status: 401 })
      }
      
      // Nếu là admin, cho phép làm tất cả bài thi
      // Nếu là user thường, chỉ cho phép làm bài thi được gán
      if (user.role !== 'admin') {
        // Kiểm tra xem user có được gán bài thi này không
        assignment = await prisma.examAssignment.findUnique({
          where: {
            examId_userId: {
              examId: params.id,
              userId: user.userId,
            },
          },
        })

        if (!assignment) {
          return NextResponse.json({ 
            error: 'Bạn chưa được gán bài thi này. Vui lòng liên hệ quản trị viên.',
          }, { status: 403 })
        }
        
        // Nếu assignment có maxAttempts riêng, dùng nó
        if (assignment.maxAttempts !== null) {
          maxAttempts = assignment.maxAttempts
        }
      } else {
        // Admin cũng có thể có assignment với maxAttempts riêng
        assignment = await prisma.examAssignment.findUnique({
          where: {
            examId_userId: {
              examId: params.id,
              userId: user.userId,
            },
          },
        })
        
        if (assignment && assignment.maxAttempts !== null) {
          maxAttempts = assignment.maxAttempts
        }
      }
    }

    // Kiểm tra thời gian mở bài thi
    const now = new Date()
    const startDate = new Date(exam.startDate)
    const endDate = new Date(exam.endDate)
    
    // Format thời gian để hiển thị
    const formatDateTime = (date: Date) => {
      return date.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    }
    
    if (now < startDate) {
      return NextResponse.json({ 
        error: `Bài thi chưa được mở.\nThời gian hiện tại: ${formatDateTime(now)}\nThời gian mở: ${formatDateTime(startDate)}`,
        currentTime: now.toISOString(),
        startTime: startDate.toISOString(),
      }, { status: 400 })
    }

    if (now > endDate) {
      return NextResponse.json({ 
        error: `Bài thi đã đóng.\nThời gian hiện tại: ${formatDateTime(now)}\nThời gian đóng: ${formatDateTime(endDate)}`,
        currentTime: now.toISOString(),
        endTime: endDate.toISOString(),
      }, { status: 400 })
    }

    // Đếm số lần đã làm của user hiện tại (nếu có đăng nhập)
    // Nếu không đăng nhập (public exam), sẽ đếm theo studentId/studentName khi submit
    let attemptCount = 0
    
    if (user) {
      // Lấy studentId từ user (có thể là username hoặc id)
      const userInfo = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { username: true, fullName: true },
      })

      attemptCount = await prisma.examResult.count({
        where: { 
          examId: params.id,
          // Đếm theo studentId hoặc studentName
          OR: [
            { studentId: user.userId },
            { studentId: userInfo?.username || '' },
            { studentName: userInfo?.fullName || '' },
          ],
        },
      })
    }
    // Nếu không đăng nhập, attemptCount = 0 (sẽ đếm khi submit dựa trên studentId/studentName)

    if (attemptCount >= maxAttempts) {
      return NextResponse.json({ 
        error: `Bạn đã làm bài thi này ${attemptCount} lần (tối đa ${maxAttempts} lần)` 
      }, { status: 400 })
    }

    // Lấy tất cả câu hỏi từ ngân hàng (có thể lọc theo category nếu exam có categories)
    const allQuestions = await prisma.question.findMany()
    
    if (allQuestions.length < exam.questionCount) {
      return NextResponse.json({ 
        error: `Ngân hàng câu hỏi chỉ có ${allQuestions.length} câu, không đủ ${exam.questionCount} câu` 
      }, { status: 400 })
    }

    // Lấy danh sách câu hỏi đã làm trong các lần thi trước
    let previousQuestionIds: string[] = []
    let questionUsageCount: { [questionId: string]: number } = {}
    
    // Xác định studentId để lấy lịch sử câu hỏi (chỉ khi user đã đăng nhập)
    // Nếu không đăng nhập, không thể lấy lịch sử, nhưng vẫn chọn câu hỏi ngẫu nhiên
    if (user) {
      // Lấy userInfo để tìm thêm username/fullName
      const userInfo = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { username: true, fullName: true },
      })

      // Lấy tất cả kết quả thi trước đó của user này
      const previousResults = await prisma.examResult.findMany({
        where: {
          examId: params.id,
          OR: [
            { studentId: user.userId },
            { studentId: userInfo?.username || '' },
            { studentName: userInfo?.fullName || '' },
          ],
        },
        select: {
          questionIds: true,
        },
      })

      // Thu thập tất cả questionIds đã làm và đếm số lần mỗi câu hỏi đã được làm
      previousResults.forEach(result => {
        if (result.questionIds) {
          try {
            const questionIds = JSON.parse(result.questionIds) as string[]
            questionIds.forEach(qId => {
              previousQuestionIds.push(qId)
              questionUsageCount[qId] = (questionUsageCount[qId] || 0) + 1
            })
          } catch (e) {
            // Nếu không parse được, bỏ qua
          }
        }
      })
    }

    // Phân loại câu hỏi: chưa làm và đã làm
    const unusedQuestions = allQuestions.filter(q => !previousQuestionIds.includes(q.id))
    const usedQuestions = allQuestions.filter(q => previousQuestionIds.includes(q.id))

    // Sắp xếp câu hỏi đã làm theo số lần đã làm (ít nhất trước)
    usedQuestions.sort((a, b) => {
      const countA = questionUsageCount[a.id] || 0
      const countB = questionUsageCount[b.id] || 0
      return countA - countB
    })

    // Chọn câu hỏi: ưu tiên chưa làm, sau đó là đã làm ít nhất
    // Sử dụng Set để đảm bảo không có câu hỏi trùng lặp
    let selectedQuestions: typeof allQuestions = []
    const selectedQuestionIds = new Set<string>()
    
    // Helper function để thêm câu hỏi không trùng lặp
    const addQuestionIfNotExists = (question: typeof allQuestions[0]) => {
      if (!selectedQuestionIds.has(question.id) && selectedQuestions.length < exam.questionCount) {
        selectedQuestions.push(question)
        selectedQuestionIds.add(question.id)
      }
    }
    
    // Ưu tiên chọn câu hỏi chưa làm
    const unusedShuffled = [...unusedQuestions].sort(() => Math.random() - 0.5)
    for (const question of unusedShuffled) {
      if (selectedQuestions.length >= exam.questionCount) break
      addQuestionIfNotExists(question)
    }
    
    // Nếu không đủ, bổ sung từ câu hỏi đã làm ít nhất
    if (selectedQuestions.length < exam.questionCount) {
      for (const question of usedQuestions) {
        if (selectedQuestions.length >= exam.questionCount) break
        addQuestionIfNotExists(question)
      }
    }
    
    // Nếu vẫn không đủ (trường hợp hiếm), trộn lại và chọn ngẫu nhiên
    if (selectedQuestions.length < exam.questionCount) {
      const allShuffled = [...allQuestions].sort(() => Math.random() - 0.5)
      for (const question of allShuffled) {
        if (selectedQuestions.length >= exam.questionCount) break
        addQuestionIfNotExists(question)
      }
    }

    // Lấy câu hỏi đã chọn
    let questions = selectedQuestions
    
    // Trộn thứ tự câu hỏi nếu cần
    if (exam.shuffleQuestions && questions.length > 0) {
      questions = [...questions].sort(() => Math.random() - 0.5)
    }

    // KHÔNG lưu examQuestions vào DB để tránh xung đột khi nhiều người cùng thi
    // Mỗi người sẽ có câu hỏi riêng, được lưu vào ExamResult.questionIds khi submit

    // Trộn đáp án nếu cần
    if (exam.shuffleAnswers && questions.length > 0) {
      questions = questions.map(q => {
        try {
          const options = JSON.parse(q.options || '[]')
          const shuffled = Array.isArray(options) 
            ? [...options].sort(() => Math.random() - 0.5)
            : []
          return { ...q, options: JSON.stringify(shuffled) }
        } catch {
          return { ...q, options: '[]' }
        }
      })
    }

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        timeLimit: exam.timeLimit,
        questionCount: exam.questionCount,
        requireAllQuestions: exam.requireAllQuestions || false,
      },
      questions: Array.isArray(questions) ? questions : [],
      attemptNumber: attemptCount + 1,
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Lỗi khi bắt đầu bài thi: ' + error.message 
    }, { status: 500 })
  }
}

