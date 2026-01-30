import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { answers, answerMappings, questionIds: bodyQuestionIds, displayOptions: bodyDisplayOptions, timeSpent, studentName, studentId } = body

    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Không tìm thấy bài thi' }, { status: 404 })
    }

    // Đếm số lần đã làm của user này (dựa trên studentId hoặc studentName)
    const attemptCount = await prisma.examResult.count({
      where: { 
        examId: params.id,
        OR: [
          { studentId: studentId || '' },
          { studentName: studentName || '' },
        ],
      },
    })

    // Lấy maxAttempts từ assignment nếu có (cho user đã đăng nhập)
    let maxAttempts = exam.maxAttempts
    if (studentId) {
      // Tìm user theo studentId
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: studentId },
            { username: studentId },
          ],
        },
      })
      
      if (user) {
        const assignment = await prisma.examAssignment.findUnique({
          where: {
            examId_userId: {
              examId: params.id,
              userId: user.id,
            },
          },
        })
        
        if (assignment && assignment.maxAttempts !== null) {
          maxAttempts = assignment.maxAttempts
        }
      }
    }

    if (attemptCount >= maxAttempts) {
      return NextResponse.json({ 
        error: `Bạn đã làm bài thi này ${attemptCount} lần (tối đa ${maxAttempts} lần)` 
      }, { status: 400 })
    }

    // Tổng số câu = toàn bộ câu hỏi của đề (client gửi questionIds khi start). Câu không trả lời = sai.
    const questionIds: string[] = Array.isArray(bodyQuestionIds) && bodyQuestionIds.length > 0
      ? bodyQuestionIds
      : Object.keys(answers)
    const totalQuestions = questionIds.length

    if (totalQuestions === 0) {
      return NextResponse.json({ error: 'Không có câu hỏi nào' }, { status: 400 })
    }

    // Lấy thông tin câu hỏi từ database
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
      },
    })

    // Tạo map để truy cập nhanh
    const questionMap = new Map(questions.map(q => [q.id, q]))

    // Tính điểm và chuẩn bị answers để lưu (dùng nhãn cũ để xem kết quả đúng)
    let correctCount = 0
    const answersToSave: Record<string, string[]> = {} // Lưu nhãn cũ để trang xem kết quả hiển thị đúng

    for (const questionId of questionIds) {
      const question = questionMap.get(questionId)
      if (!question) continue // Bỏ qua nếu không tìm thấy câu hỏi

      let userAnswers = answers[questionId] || []
      
      // Nếu có trộn đáp án, map lại từ nhãn mới về nhãn cũ
      if (answerMappings && answerMappings[questionId]) {
        const mapping = answerMappings[questionId] as { [newLabel: string]: string } // { "A": "B", "B": "A", ... }
        userAnswers = userAnswers.map((newLabel: string) => {
          // Map nhãn mới về nhãn cũ
          return mapping[newLabel] || newLabel
        })
      }
      
      // Lưu đáp án đã map (nhãn cũ) để trang xem kết quả so sánh đúng với options gốc
      answersToSave[questionId] = userAnswers
      
      const correctAnswers = JSON.parse(question.correctAnswers)

      // So sánh đáp án (không phân biệt thứ tự)
      const userSorted = [...userAnswers].sort().join(',')
      const correctSorted = [...correctAnswers].sort().join(',')

      if (userSorted === correctSorted) {
        correctCount++
      }
    }

    const score = (correctCount / totalQuestions) * 10

    // Lưu kết quả - không gửi displayOptions vào create để tránh lỗi khi Prisma client cũ (Vercel) chưa có field này
    const result = await prisma.examResult.create({
      data: {
        examId: params.id,
        studentName,
        studentId: studentId ?? undefined,
        score,
        totalQuestions,
        correctAnswers: correctCount,
        answers: JSON.stringify(answersToSave),
        questionIds: JSON.stringify(questionIds),
        timeSpent,
        attemptNumber: attemptCount + 1,
      },
    })

    // Cập nhật displayOptions bằng raw SQL (hoạt động dù Prisma client có hay chưa có field này)
    if (bodyDisplayOptions && typeof bodyDisplayOptions === 'object' && Object.keys(bodyDisplayOptions).length > 0) {
      const displayOptionsJson = JSON.stringify(bodyDisplayOptions)
      await prisma.$executeRaw`
        UPDATE "ExamResult" SET "displayOptions" = ${displayOptionsJson} WHERE "id" = ${result.id}
      `
    }

    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        score,
        totalQuestions,
        correctAnswers: correctCount,
        attemptNumber: attemptCount + 1,
      },
    })
  } catch (error: any) {
    console.error('Submit error:', error)
    return NextResponse.json({ 
      error: 'Lỗi khi nộp bài: ' + error.message 
    }, { status: 500 })
  }
}

