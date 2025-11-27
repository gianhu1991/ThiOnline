import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    })

    if (!document) {
      return NextResponse.json({ error: 'Không tìm thấy tài liệu' }, { status: 404 })
    }

    // Kiểm tra quyền xem (nếu không phải admin và không public)
    if (!user || user.role !== 'admin') {
      if (!document.isPublic) {
        return NextResponse.json({ error: 'Tài liệu này không công khai' }, { status: 403 })
      }
    }

    // Tăng số lượt tải
    await prisma.document.update({
      where: { id: params.id },
      data: { downloadCount: { increment: 1 } },
    })

    return NextResponse.json(document)
  } catch (error: any) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy tài liệu' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xóa tài liệu' }, { status: 403 })
    }

    await prisma.document.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Lỗi khi xóa tài liệu' }, { status: 500 })
  }
}

