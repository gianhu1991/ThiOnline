import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[DELETE /api/videos/[id]] ========== START ==========')
    const user = await getJWT(request)
    console.log('[DELETE /api/videos/[id]] JWT user:', { userId: user?.userId, username: user?.username, role: user?.role })

    if (!user || !user.role) {
      console.log('[DELETE /api/videos/[id]] ❌ No user or role')
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    // Admin luôn được phép
    if (user.role !== 'admin') {
      console.log('[DELETE /api/videos/[id]] 🔍 Checking permission DELETE_VIDEOS...')
      const canDelete = await hasUserPermission(user.userId, user.role, PERMISSIONS.DELETE_VIDEOS, user.username)
      console.log('[DELETE /api/videos/[id]] 📊 Permission check result:', {
        userId: user.userId,
        username: user.username,
        role: user.role,
        permission: PERMISSIONS.DELETE_VIDEOS,
        canDelete
      })
      if (!canDelete) {
        console.log('[DELETE /api/videos/[id]] ❌ Permission denied - returning 403')
        return NextResponse.json({ error: 'Bạn không có quyền xóa video' }, { status: 403 })
      }
      console.log('[DELETE /api/videos/[id]] ✅ Permission granted')
    } else {
      console.log('[DELETE /api/videos/[id]] ✅ Admin - bypassing permission check')
    }

    await prisma.video.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi xóa video' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[PUT /api/videos/[id]] ========== START ==========')
    const user = await getJWT(request)
    console.log('[PUT /api/videos/[id]] JWT user:', { userId: user?.userId, username: user?.username, role: user?.role })

    if (!user || !user.role) {
      console.log('[PUT /api/videos/[id]] ❌ No user or role')
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    // Admin luôn được phép
    if (user.role !== 'admin') {
      console.log('[PUT /api/videos/[id]] 🔍 Checking permission EDIT_VIDEOS...')
      const canEdit = await hasUserPermission(user.userId, user.role, PERMISSIONS.EDIT_VIDEOS, user.username)
      console.log('[PUT /api/videos/[id]] 📊 Permission check result:', {
        userId: user.userId,
        username: user.username,
        role: user.role,
        permission: PERMISSIONS.EDIT_VIDEOS,
        canEdit
      })
      if (!canEdit) {
        console.log('[PUT /api/videos/[id]] ❌ Permission denied - returning 403')
        return NextResponse.json({ error: 'Bạn không có quyền sửa video' }, { status: 403 })
      }
      console.log('[PUT /api/videos/[id]] ✅ Permission granted')
    } else {
      console.log('[PUT /api/videos/[id]] ✅ Admin - bypassing permission check')
    }

    const body = await request.json()
    const { title, description, url, thumbnail, category, isPublic } = body

    const video = await prisma.video.update({
      where: { id: params.id },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        url: url || undefined,
        thumbnail: thumbnail !== undefined ? thumbnail : undefined,
        category: category !== undefined ? category : undefined,
        isPublic: isPublic !== undefined ? isPublic : undefined,
      },
    })

    return NextResponse.json({ success: true, video })
  } catch (error: any) {
    console.error('Error updating video:', error)
    return NextResponse.json({ error: 'Lỗi khi cập nhật video' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    const video = await prisma.video.findUnique({
      where: { id: params.id },
    })

    if (!video) {
      return NextResponse.json({ error: 'Không tìm thấy video' }, { status: 404 })
    }

    // Kiểm tra quyền truy cập
    let hasAccess = false

    if (user && user.role === 'admin') {
      // Admin xem tất cả
      hasAccess = true
    } else if (video.isPublic) {
      // Video public: tất cả đều xem được
      hasAccess = true
    } else if (user) {
      // Video không public: kiểm tra user có thuộc nhóm được gán không
      const userGroups = await prisma.userGroupMember.findMany({
        where: { userId: user.userId },
        select: { groupId: true },
      })
      const groupIds = userGroups.map(ug => ug.groupId)

      if (groupIds.length > 0) {
        const videoGroup = await prisma.videoGroup.findFirst({
          where: {
            videoId: params.id,
            groupId: { in: groupIds },
          },
        })
        hasAccess = !!videoGroup
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Bạn không có quyền xem video này' }, { status: 403 })
    }

    // Tăng view count
    await prisma.video.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json({ ...video, viewCount: video.viewCount + 1 })
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi lấy video' }, { status: 500 })
  }
}

