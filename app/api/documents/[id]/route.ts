import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'

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
    console.log('[PUT /api/documents/[id]] ========== START ==========')
    const user = await getJWT(request)
    console.log('[PUT /api/documents/[id]] JWT user:', { userId: user?.userId, username: user?.username, role: user?.role })

    if (!user || !user.role) {
      console.log('[PUT /api/documents/[id]] ❌ No user or role')
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    // Admin luôn được phép
    if (user.role !== 'admin') {
      console.log('[PUT /api/documents/[id]] 🔍 Checking permission EDIT_DOCUMENTS...')
      const canEdit = await hasUserPermission(user.userId, user.role, PERMISSIONS.EDIT_DOCUMENTS, user.username)
      console.log('[PUT /api/documents/[id]] 📊 Permission check result:', {
        userId: user.userId,
        username: user.username,
        role: user.role,
        permission: PERMISSIONS.EDIT_DOCUMENTS,
        canEdit
      })
      if (!canEdit) {
        console.log('[PUT /api/documents/[id]] ❌ Permission denied - returning 403')
        return NextResponse.json({ error: 'Bạn không có quyền sửa tài liệu' }, { status: 403 })
      }
      console.log('[PUT /api/documents/[id]] ✅ Permission granted')
    } else {
      console.log('[PUT /api/documents/[id]] ✅ Admin - bypassing permission check')
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
    console.log('[DELETE /api/documents/[id]] ========== START ==========')
    const user = await getJWT(request)
    console.log('[DELETE /api/documents/[id]] JWT user:', { userId: user?.userId, username: user?.username, role: user?.role })

    if (!user || !user.role) {
      console.log('[DELETE /api/documents/[id]] ❌ No user or role')
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    // Admin luôn được phép
    if (user.role !== 'admin') {
      console.log('[DELETE /api/documents/[id]] 🔍 Checking permission DELETE_DOCUMENTS...')
      const canDelete = await hasUserPermission(user.userId, user.role, PERMISSIONS.DELETE_DOCUMENTS, user.username)
      console.log('[DELETE /api/documents/[id]] 📊 Permission check result:', {
        userId: user.userId,
        username: user.username,
        role: user.role,
        permission: PERMISSIONS.DELETE_DOCUMENTS,
        canDelete
      })
      if (!canDelete) {
        console.log('[DELETE /api/documents/[id]] ❌ Permission denied - returning 403')
        return NextResponse.json({ error: 'Bạn không có quyền xóa tài liệu' }, { status: 403 })
      }
      console.log('[DELETE /api/documents/[id]] ✅ Permission granted')
    } else {
      console.log('[DELETE /api/documents/[id]] ✅ Admin - bypassing permission check')
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

