import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const fullData = searchParams.get('full') === 'true'

    const where: any = {}
    
    // Nếu là admin, lấy tất cả tài liệu
    if (user && user.role === 'admin') {
      // Admin xem tất cả
    } else if (user) {
      // User thường: lấy tài liệu public HOẶC tài liệu được gán cho nhóm của user
      const userGroups = await prisma.userGroupMember.findMany({
        where: { userId: user.userId },
        select: { groupId: true },
      })
      const groupIds = userGroups.map(ug => ug.groupId)

      const documentGroups = await prisma.documentGroup.findMany({
        where: { groupId: { in: groupIds } },
        select: { documentId: true },
      })
      const allowedDocumentIds = documentGroups.map(dg => dg.documentId)

      where.OR = [
        { isPublic: true },
        { id: { in: allowedDocumentIds } },
      ]
    } else {
      // Chưa đăng nhập: chỉ xem tài liệu public
      where.isPublic = true
    }
    
    if (category && category !== 'all') {
      where.category = category
    }
    
    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      // Luôn trả về đầy đủ dữ liệu cho trang documents
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        fileName: true,
        fileSize: true,
        category: true,
        isPublic: true,
        downloadCount: true,
        uploadedBy: true,
        createdAt: true,
      }
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

