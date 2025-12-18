import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const fullData = searchParams.get('full') === 'true'

    const where: any = {}
    
    // Nếu là admin, lấy tất cả video
    if (user && user.role === 'admin') {
      // Admin xem tất cả
    } else if (user) {
      // User thường: lấy video public HOẶC video được gán cho nhóm của user
      const userGroups = await prisma.userGroupMember.findMany({
        where: { userId: user.userId },
        select: { groupId: true },
      })
      const groupIds = userGroups.map(ug => ug.groupId)

      const videoGroups = await prisma.videoGroup.findMany({
        where: { groupId: { in: groupIds } },
        select: { videoId: true },
      })
      const allowedVideoIds = videoGroups.map(vg => vg.videoId)

      where.OR = [
        { isPublic: true },
        { id: { in: allowedVideoIds } },
      ]
    } else {
      // Chưa đăng nhập: chỉ xem video public
      where.isPublic = true
    }
    
    if (category && category !== 'all') {
      where.category = category
    }
    
    const videos = await prisma.video.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      // Chỉ select fields cần thiết nếu không cần full data (tối ưu cho dropdown)
      ...(fullData ? {} : {
        select: {
          id: true,
          title: true,
          viewCount: true, // Cần viewCount để hiển thị
          category: true, // Cần category để hiển thị
          thumbnail: true, // Cần thumbnail để hiển thị
          uploadedBy: true, // Cần uploadedBy để hiển thị
          createdAt: true, // Cần createdAt để hiển thị
        }
      })
    })

    return NextResponse.json(videos)
  } catch (error: any) {
    console.error('Error fetching videos:', error)
    if (error.message?.includes('does not exist') || error.code === 'P2021') {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách video' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/videos] ========== START ==========')
    const user = await getJWT(request)
    console.log('[POST /api/videos] JWT user:', { userId: user?.userId, username: user?.username, role: user?.role })

    if (!user || !user.role) {
      console.log('[POST /api/videos] ❌ No user or role')
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    // Admin luôn được phép
    if (user.role !== 'admin') {
      // Kiểm tra quyền CREATE_VIDEOS (bao gồm cả đặc cách)
      console.log('[POST /api/videos] 🔍 Checking permission CREATE_VIDEOS...')
      const canCreate = await hasUserPermission(user.userId, user.role, PERMISSIONS.CREATE_VIDEOS, user.username)
      console.log('[POST /api/videos] 📊 Permission check result:', {
        userId: user.userId,
        username: user.username,
        role: user.role,
        permission: PERMISSIONS.CREATE_VIDEOS,
        canCreate
      })
      if (!canCreate) {
        console.log('[POST /api/videos] ❌ Permission denied - returning 403')
        return NextResponse.json({ error: 'Bạn không có quyền tạo video' }, { status: 403 })
      }
      console.log('[POST /api/videos] ✅ Permission granted')
    } else {
      console.log('[POST /api/videos] ✅ Admin - bypassing permission check')
    }

    const body = await request.json()
    const { title, description, url, thumbnail, category, isPublic } = body

    if (!title || !url) {
      return NextResponse.json({ error: 'Vui lòng nhập tiêu đề và URL video' }, { status: 400 })
    }

    const video = await prisma.video.create({
      data: {
        title,
        description: description || null,
        url,
        thumbnail: thumbnail || null,
        category: category || null,
        isPublic: isPublic !== undefined ? isPublic : true,
        uploadedBy: user.username,
      },
    })

    return NextResponse.json({ success: true, video })
  } catch (error: any) {
    console.error('Error creating video:', error)
    return NextResponse.json({ error: 'Lỗi khi tạo video: ' + error.message }, { status: 500 })
  }
}

