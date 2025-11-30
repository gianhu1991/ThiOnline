import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// GET: Lấy thông tin chi tiết nhóm (bao gồm danh sách thành viên)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xem thông tin nhóm' }, { status: 403 })
    }

    const group = await prisma.userGroup.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        videoGroups: {
          include: {
            video: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        documentGroups: {
          include: {
            document: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Không tìm thấy nhóm' }, { status: 404 })
    }

    return NextResponse.json({ success: true, group })
  } catch (error: any) {
    console.error('Error fetching user group:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy thông tin nhóm: ' + error.message }, { status: 500 })
  }
}

// PUT: Cập nhật thông tin nhóm
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được cập nhật nhóm' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Vui lòng nhập tên nhóm' }, { status: 400 })
    }

    const group = await prisma.userGroup.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    })

    return NextResponse.json({ success: true, group })
  } catch (error: any) {
    console.error('Error updating user group:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Không tìm thấy nhóm' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Tên nhóm đã tồn tại' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Lỗi khi cập nhật nhóm: ' + error.message }, { status: 500 })
  }
}

// DELETE: Xóa nhóm
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xóa nhóm' }, { status: 403 })
    }

    await prisma.userGroup.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting user group:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Không tìm thấy nhóm' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Lỗi khi xóa nhóm: ' + error.message }, { status: 500 })
  }
}

