import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Nếu là user thường, chỉ lấy video public
    // Nếu là admin, lấy tất cả
    const where: any = {}
    
    if (!user || user.role !== 'admin') {
      where.isPublic = true
    }
    
    if (category && category !== 'all') {
      where.category = category
    }

    const videos = await prisma.video.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được upload video' }, { status: 403 })
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

