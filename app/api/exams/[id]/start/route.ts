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
    let questions = Array.isArray(exam.examQuestions) 
      ? exam.examQuestions.map(eq => eq.question).filter(q => q !== null && q !== undefined)
      : []
    
    if (exam.shuffleQuestions && questions.length > 0) {
      questions = [...questions].sort(() => Math.random() - 0.5)
    }

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

