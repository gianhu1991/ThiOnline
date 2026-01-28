import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { answers, answerMappings, timeSpent, studentName, studentId } = body

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

    // Tính điểm dựa trên câu hỏi thực tế đã làm (từ answers object)
    // Lấy questionIds từ answers để đảm bảo chính xác, không phụ thuộc vào exam.examQuestions
    // (vì nhiều người cùng thi có thể ghi đè lên exam.examQuestions)
    const questionIds: string[] = Object.keys(answers) // Lấy danh sách câu hỏi từ answers
    const totalQuestions = questionIds.length

    if (totalQuestions === 0) {
      return NextResponse.json({ error: 'Không có câu trả lời nào' }, { status: 400 })
    }

    // Lấy thông tin câu hỏi từ database
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
      },
    })

    // Tạo map để truy cập nhanh
    const questionMap = new Map(questions.map(q => [q.id, q]))

    // Tính điểm cho từng câu hỏi đã làm
    let correctCount = 0
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
      
      const correctAnswers = JSON.parse(question.correctAnswers)

      // So sánh đáp án (không phân biệt thứ tự)
      const userSorted = [...userAnswers].sort().join(',')
      const correctSorted = [...correctAnswers].sort().join(',')

      if (userSorted === correctSorted) {
        correctCount++
      }
    }

    const score = (correctCount / totalQuestions) * 10

    // Lưu kết quả
    const result = await prisma.examResult.create({
      data: {
        examId: params.id,
        studentName,
        studentId,
        score,
        totalQuestions,
        correctAnswers: correctCount,
        answers: JSON.stringify(answers),
        questionIds: JSON.stringify(questionIds), // Lưu danh sách câu hỏi đã làm
        timeSpent,
        attemptNumber: attemptCount + 1,
      },
    })

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

