import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
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
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Không tìm thấy bài thi' }, { status: 404 })
    }

    return NextResponse.json(exam)
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi lấy thông tin bài thi' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      questionCount,
      timeLimit,
      startDate,
      endDate,
      shuffleQuestions,
      shuffleAnswers,
      maxAttempts,
    } = body

    // Validation
    if (!title || !questionCount || !timeLimit || !startDate || !endDate || !maxAttempts) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
    }

    // datetime-local input trả về local time (không có timezone)
    // Cần convert sang UTC để lưu vào database
    // Format: "2025-11-26T14:20" (local time)
    const parseLocalDateTime = (dateTimeString: string) => {
      // Tạo Date object từ local time string
      // "2025-11-26T14:20" -> được interpret như local time
      const localDate = new Date(dateTimeString)
      // Trả về Date object (sẽ được lưu như UTC trong database)
      return localDate
    }

    const exam = await prisma.exam.update({
      where: { id: params.id },
      data: {
        title,
        description: description || null,
        questionCount: parseInt(questionCount),
        timeLimit: parseInt(timeLimit),
        startDate: parseLocalDateTime(startDate),
        endDate: parseLocalDateTime(endDate),
        shuffleQuestions: shuffleQuestions === true || shuffleQuestions === 'true',
        shuffleAnswers: shuffleAnswers === true || shuffleAnswers === 'true',
        maxAttempts: parseInt(maxAttempts),
      },
    })

    return NextResponse.json({ success: true, exam })
  } catch (error: any) {
    console.error('Error updating exam:', error)
    return NextResponse.json({ error: 'Lỗi khi cập nhật bài thi' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.exam.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi xóa bài thi' }, { status: 500 })
  }
}

