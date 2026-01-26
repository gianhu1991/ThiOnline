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
      requireAllQuestions,
      maxAttempts,
      categories, // Array of category names hoặc null
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

    // Nếu có categories, cần re-select questions từ các lĩnh vực đó
    if (categories && Array.isArray(categories) && categories.length > 0) {
      // Lấy câu hỏi từ ngân hàng, lọc theo category
      const allQuestions = await prisma.question.findMany({
        where: {
          category: {
            in: categories,
          },
        },
      })
      
      if (allQuestions.length < questionCount) {
        return NextResponse.json({ 
          error: `Ngân hàng câu hỏi trong ${categories.length} lĩnh vực đã chọn chỉ có ${allQuestions.length} câu, không đủ ${questionCount} câu` 
        }, { status: 400 })
      }

      // Trộn và chọn ngẫu nhiên
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5)
      const selectedQuestions = shuffled.slice(0, parseInt(questionCount))

      // Xóa các examQuestions cũ và tạo mới
      await prisma.examQuestion.deleteMany({
        where: { examId: params.id },
      })

      // Cập nhật exam và tạo examQuestions mới
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
          requireAllQuestions: requireAllQuestions === true || requireAllQuestions === 'true',
          maxAttempts: parseInt(maxAttempts),
          examQuestions: {
            create: selectedQuestions.map((q, index) => ({
              questionId: q.id,
              order: index + 1,
            })),
          },
        },
      })

      return NextResponse.json({ success: true, exam })
    } else {
      // Không có categories hoặc categories rỗng = lấy từ tất cả category
      // Kiểm tra số lượng câu hỏi có sẵn
      const allQuestions = await prisma.question.findMany()
      
      if (allQuestions.length < questionCount) {
        return NextResponse.json({ 
          error: `Ngân hàng câu hỏi chỉ có ${allQuestions.length} câu, không đủ ${questionCount} câu` 
        }, { status: 400 })
      }

      // Trộn và chọn ngẫu nhiên
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5)
      const selectedQuestions = shuffled.slice(0, parseInt(questionCount))

      // Xóa các examQuestions cũ và tạo mới
      await prisma.examQuestion.deleteMany({
        where: { examId: params.id },
      })

      // Cập nhật exam và tạo examQuestions mới
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
          requireAllQuestions: requireAllQuestions === true || requireAllQuestions === 'true',
          maxAttempts: parseInt(maxAttempts),
          examQuestions: {
            create: selectedQuestions.map((q, index) => ({
              questionId: q.id,
              order: index + 1,
            })),
          },
        },
      })

      return NextResponse.json({ success: true, exam })
    }
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

