import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    return NextResponse.json(exams)
  } catch (error) {
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

    // Tạo bài thi
    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        questionCount,
        timeLimit,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
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

