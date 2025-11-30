import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    // Nếu bảng chưa tồn tại, trả về mảng rỗng
    if (error.message?.includes('does not exist') || error.code === 'P2021') {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách lĩnh vực' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tên lĩnh vực không được để trống' }, { status: 400 })
    }

    // Kiểm tra xem đã tồn tại chưa
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() },
    })

    if (existing) {
      return NextResponse.json({ error: 'Lĩnh vực này đã tồn tại' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: { name: name.trim() },
    })

    return NextResponse.json({ success: true, category })
  } catch (error: any) {
    console.error('Error creating category:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Lĩnh vực này đã tồn tại' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Lỗi khi tạo lĩnh vực' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID lĩnh vực' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tên lĩnh vực không được để trống' }, { status: 400 })
    }

    // Kiểm tra xem tên mới đã tồn tại chưa (trừ chính nó)
    const existing = await prisma.category.findFirst({
      where: { 
        name: name.trim(),
        NOT: { id }
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Lĩnh vực này đã tồn tại' }, { status: 400 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim() },
    })

    return NextResponse.json({ success: true, category })
  } catch (error: any) {
    console.error('Error updating category:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Lĩnh vực này đã tồn tại' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Lỗi khi cập nhật lĩnh vực' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID lĩnh vực' }, { status: 400 })
    }

    // Kiểm tra xem có câu hỏi nào đang dùng lĩnh vực này không
    const questionsCount = await prisma.question.count({
      where: { category: id },
    })

    if (questionsCount > 0) {
      return NextResponse.json({ 
        error: `Không thể xóa lĩnh vực này vì có ${questionsCount} câu hỏi đang sử dụng` 
      }, { status: 400 })
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Lỗi khi xóa lĩnh vực' }, { status: 500 })
  }
}

