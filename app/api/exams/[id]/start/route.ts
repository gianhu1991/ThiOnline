import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Kiểm tra thời gian mở bài thi
    const now = new Date()
    if (now < exam.startDate) {
      return NextResponse.json({ 
        error: 'Bài thi chưa được mở. Thời gian mở: ' + exam.startDate.toLocaleString('vi-VN') 
      }, { status: 400 })
    }

    if (now > exam.endDate) {
      return NextResponse.json({ 
        error: 'Bài thi đã đóng. Thời gian đóng: ' + exam.endDate.toLocaleString('vi-VN') 
      }, { status: 400 })
    }

    // Đếm số lần đã làm
    const attemptCount = await prisma.examResult.count({
      where: { examId: params.id },
    })

    if (attemptCount >= exam.maxAttempts) {
      return NextResponse.json({ 
        error: `Bạn đã làm bài thi này ${attemptCount} lần (tối đa ${exam.maxAttempts} lần)` 
      }, { status: 400 })
    }

    // Trộn câu hỏi nếu cần
    let questions = exam.examQuestions.map(eq => eq.question)
    if (exam.shuffleQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5)
    }

    // Trộn đáp án nếu cần
    if (exam.shuffleAnswers) {
      questions = questions.map(q => {
        const options = JSON.parse(q.options)
        const shuffled = [...options].sort(() => Math.random() - 0.5)
        return { ...q, options: JSON.stringify(shuffled) }
      })
    }

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        timeLimit: exam.timeLimit,
        questionCount: exam.questionCount,
      },
      questions,
      attemptNumber: attemptCount + 1,
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Lỗi khi bắt đầu bài thi: ' + error.message 
    }, { status: 500 })
  }
}

