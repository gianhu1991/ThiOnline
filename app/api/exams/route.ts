import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Đảm bảo route này luôn dynamic, không cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        _count: {
          select: { examResults: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(exams, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('Error fetching exams:', error)
    // Nếu bảng chưa tồn tại, trả về mảng rỗng
    if (error.message?.includes('does not exist') || error.code === 'P2021') {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách bài thi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    // Lấy ngẫu nhiên câu hỏi từ ngân hàng
    const allQuestions = await prisma.question.findMany()
    
    if (allQuestions.length < questionCount) {
      return NextResponse.json({ 
        error: `Ngân hàng câu hỏi chỉ có ${allQuestions.length} câu, không đủ ${questionCount} câu` 
      }, { status: 400 })
    }

    // Trộn và chọn ngẫu nhiên
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5)
    const selectedQuestions = shuffled.slice(0, questionCount)

    // datetime-local input trả về local time (không có timezone)
    // Cần convert sang UTC để lưu vào database
    const parseLocalDateTime = (dateTimeString: string) => {
      // Tạo Date object từ local time string
      // "2025-11-26T14:20" -> được interpret như local time
      return new Date(dateTimeString)
    }

    // Tạo bài thi
    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        questionCount,
        timeLimit,
        startDate: parseLocalDateTime(startDate),
        endDate: parseLocalDateTime(endDate),
        shuffleQuestions: shuffleQuestions || false,
        shuffleAnswers: shuffleAnswers || false,
        maxAttempts: maxAttempts || 1,
        examQuestions: {
          create: selectedQuestions.map((q, index) => ({
            questionId: q.id,
            order: index + 1,
          })),
        },
      },
      include: {
        examQuestions: true,
      },
    })

    return NextResponse.json(exam)
  } catch (error: any) {
    console.error('Create exam error:', error)
    return NextResponse.json({ 
      error: 'Lỗi khi tạo bài thi: ' + error.message 
    }, { status: 500 })
  }
}

