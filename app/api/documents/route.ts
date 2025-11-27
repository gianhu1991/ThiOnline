import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Nếu là user thường, chỉ lấy document public
    // Nếu là admin, lấy tất cả
    const where: any = {}
    
    if (!user || user.role !== 'admin') {
      where.isPublic = true
    }
    
    if (category && category !== 'all') {
      where.category = category
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(documents)
  } catch (error: any) {
    console.error('Error fetching documents:', error)
    if (error.message?.includes('does not exist') || error.code === 'P2021') {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách tài liệu' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được upload tài liệu' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, url, fileName, fileSize, category, isPublic } = body

    if (!title || !url) {
      return NextResponse.json({ error: 'Vui lòng nhập tiêu đề và URL tài liệu' }, { status: 400 })
    }

    const document = await prisma.document.create({
      data: {
        title,
        description: description || null,
        url,
        fileName: fileName || null,
        fileSize: fileSize || 0,
        category: category || null,
        isPublic: isPublic !== undefined ? isPublic : true,
        uploadedBy: user.username,
      },
    })

    return NextResponse.json({ success: true, document })
  } catch (error: any) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Lỗi khi tạo tài liệu: ' + error.message }, { status: 500 })
  }
}

