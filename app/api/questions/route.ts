import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Đảm bảo route này luôn dynamic, không cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where = category && category !== 'all' ? { category } : {}

    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(questions, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('Error fetching questions:', error)
    // Nếu bảng chưa tồn tại, trả về mảng rỗng
    if (error.message?.includes('does not exist') || error.code === 'P2021') {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách câu hỏi' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID câu hỏi' }, { status: 400 })
    }

    const body = await request.json()
    const { content, options, correctAnswers, type, category } = body

    if (!content || !options || !correctAnswers || !type) {
      return NextResponse.json({ error: 'Thiếu thông tin cần thiết' }, { status: 400 })
    }

    const question = await prisma.question.update({
      where: { id },
      data: {
        content,
        options: JSON.stringify(options),
        correctAnswers: JSON.stringify(correctAnswers),
        type,
        category: category || null,
      },
    })

    return NextResponse.json({ success: true, question })
  } catch (error: any) {
    console.error('Error updating question:', error)
    return NextResponse.json({ error: 'Lỗi khi cập nhật câu hỏi' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const deleteAll = searchParams.get('all') === 'true'
    
    if (deleteAll) {
      // Xóa tất cả câu hỏi
      // ExamQuestion sẽ tự động bị xóa do cascade delete
      const result = await prisma.question.deleteMany({})
      return NextResponse.json({ 
        success: true, 
        message: `Đã xóa ${result.count} câu hỏi`,
        count: result.count
      })
    }
    
    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID câu hỏi' }, { status: 400 })
    }

    await prisma.question.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi xóa câu hỏi' }, { status: 500 })
  }
}

