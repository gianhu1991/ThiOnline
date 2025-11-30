import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xóa video' }, { status: 403 })
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
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được sửa video' }, { status: 403 })
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

