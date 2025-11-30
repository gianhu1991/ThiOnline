import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// GET: Lấy danh sách tất cả nhóm
export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xem danh sách nhóm' }, { status: 403 })
    }

    const groups = await prisma.userGroup.findMany({
      include: {
        _count: {
          select: {
            members: true,
            videoGroups: true,
            documentGroups: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, groups })
  } catch (error: any) {
    console.error('Error fetching user groups:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách nhóm: ' + error.message }, { status: 500 })
  }
}

// POST: Tạo nhóm mới
export async function POST(request: NextRequest) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được tạo nhóm' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Vui lòng nhập tên nhóm' }, { status: 400 })
    }

    const group = await prisma.userGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    })

    return NextResponse.json({ success: true, group })
  } catch (error: any) {
    console.error('Error creating user group:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Tên nhóm đã tồn tại' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Lỗi khi tạo nhóm: ' + error.message }, { status: 500 })
  }
}

