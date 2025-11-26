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
    const video = await prisma.video.findUnique({
      where: { id: params.id },
    })

    if (!video) {
      return NextResponse.json({ error: 'Không tìm thấy video' }, { status: 404 })
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

