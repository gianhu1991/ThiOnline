import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { answers, timeSpent, studentName, studentId } = body

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

    // Tính điểm dựa trên câu hỏi thực tế đã làm (từ exam.examQuestions đã được cập nhật bởi API start)
    let correctCount = 0
    const questionIds: string[] = exam.examQuestions.map(eq => eq.questionId) // Lấy danh sách câu hỏi từ exam.examQuestions
    const totalQuestions = questionIds.length

    // Tính điểm cho từng câu hỏi đã làm
    for (const eq of exam.examQuestions) {
      const question = eq.question
      const userAnswers = answers[question.id] || []
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

