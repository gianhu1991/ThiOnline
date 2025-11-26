import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; resultId: string } }
) {
  try {
    const result = await prisma.examResult.findUnique({
      where: { id: params.resultId },
      include: {
        exam: {
          include: {
            examQuestions: {
              include: {
                question: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!result) {
      return NextResponse.json({ error: 'Không tìm thấy kết quả' }, { status: 404 })
    }

    // Parse answers từ JSON
    const userAnswers = JSON.parse(result.answers)

    // Chuẩn bị dữ liệu câu hỏi với đáp án
    const questionsWithAnswers = result.exam.examQuestions.map((eq) => {
      const question = eq.question
      const correctAnswers = JSON.parse(question.correctAnswers)
      const userSelectedAnswers = userAnswers[question.id] || []
      const options = JSON.parse(question.options)

      // Kiểm tra đáp án đúng
      const userSorted = [...userSelectedAnswers].sort().join(',')
      const correctSorted = [...correctAnswers].sort().join(',')
      const isCorrect = userSorted === correctSorted

      return {
        id: question.id,
        content: question.content,
        type: question.type,
        options,
        correctAnswers,
        userAnswers: userSelectedAnswers,
        isCorrect,
        order: eq.order,
      }
    })

    return NextResponse.json({
      result: {
        id: result.id,
        score: result.score,
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswers,
        attemptNumber: result.attemptNumber,
        timeSpent: result.timeSpent,
        completedAt: result.completedAt,
      },
      exam: {
        id: result.exam.id,
        title: result.exam.title,
        maxAttempts: result.exam.maxAttempts,
      },
      questions: questionsWithAnswers,
    })
  } catch (error: any) {
    console.error('Error fetching result details:', error)
    return NextResponse.json({ 
      error: 'Lỗi khi lấy chi tiết kết quả: ' + error.message 
    }, { status: 500 })
  }
}

