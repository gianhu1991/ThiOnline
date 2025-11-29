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

    // Parse answers và questionIds từ JSON
    const userAnswers = JSON.parse(result.answers)
    const questionIds: string[] = result.questionIds ? JSON.parse(result.questionIds) : []

    // Nếu không có questionIds (kết quả cũ), fallback về exam.examQuestions
    let questionsToShow: any[] = []
    
    if (questionIds.length > 0) {
      // Lấy câu hỏi thực tế đã làm từ questionIds
      const questions = await prisma.question.findMany({
        where: {
          id: { in: questionIds },
        },
      })

      // Tạo map để giữ thứ tự
      const questionMap = new Map(questions.map(q => [q.id, q]))

      // Chuẩn bị dữ liệu theo đúng thứ tự questionIds
      questionsToShow = questionIds.map((questionId, index) => {
        const question = questionMap.get(questionId)
        if (!question) return null

        const correctAnswers = JSON.parse(question.correctAnswers)
        const userSelectedAnswers = userAnswers[questionId] || []
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
          order: index + 1,
        }
      }).filter(q => q !== null) // Loại bỏ null nếu có
    } else {
      // Fallback cho kết quả cũ (không có questionIds)
      questionsToShow = result.exam.examQuestions.map((eq) => {
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
    }

    const questionsWithAnswers = questionsToShow

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

