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

    // Kiểm tra quyền truy cập
    let hasAccess = false

    if (user && user.role === 'admin') {
      // Admin xem tất cả
      hasAccess = true
    } else if (document.isPublic) {
      // Tài liệu public: tất cả đều xem được
      hasAccess = true
    } else if (user) {
      // Tài liệu không public: kiểm tra user có thuộc nhóm được gán không
      const userGroups = await prisma.userGroupMember.findMany({
        where: { userId: user.userId },
        select: { groupId: true },
      })
      const groupIds = userGroups.map(ug => ug.groupId)

      if (groupIds.length > 0) {
        const documentGroup = await prisma.documentGroup.findFirst({
          where: {
            documentId: params.id,
            groupId: { in: groupIds },
          },
        })
        hasAccess = !!documentGroup
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Bạn không có quyền xem tài liệu này' }, { status: 403 })
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được sửa tài liệu' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, category, isPublic } = body

    const document = await prisma.document.update({
      where: { id: params.id },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        category: category !== undefined ? category : undefined,
        isPublic: isPublic !== undefined ? isPublic : undefined,
      },
    })

    return NextResponse.json({ success: true, document })
  } catch (error: any) {
    console.error('Error updating document:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Không tìm thấy tài liệu' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Lỗi khi cập nhật tài liệu' }, { status: 500 })
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

