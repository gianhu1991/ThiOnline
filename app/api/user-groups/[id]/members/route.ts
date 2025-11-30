import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// POST: Thêm/xóa thành viên vào nhóm
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được quản lý thành viên nhóm' }, { status: 403 })
    }

    const body = await request.json()
    const { userIds, action } = body // action: 'add' hoặc 'remove'

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Vui lòng chọn ít nhất một người dùng' }, { status: 400 })
    }

    if (action !== 'add' && action !== 'remove') {
      return NextResponse.json({ error: 'Action phải là "add" hoặc "remove"' }, { status: 400 })
    }

    // Kiểm tra nhóm có tồn tại không
    const group = await prisma.userGroup.findUnique({
      where: { id: params.id },
    })

    if (!group) {
      return NextResponse.json({ error: 'Không tìm thấy nhóm' }, { status: 404 })
    }

    if (action === 'add') {
      // Thêm thành viên (bỏ qua nếu đã tồn tại)
      await prisma.userGroupMember.createMany({
        data: userIds.map((userId: string) => ({
          userId,
          groupId: params.id,
        })),
        skipDuplicates: true,
      })
    } else {
      // Xóa thành viên
      await prisma.userGroupMember.deleteMany({
        where: {
          groupId: params.id,
          userId: { in: userIds },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error managing group members:', error)
    return NextResponse.json({ error: 'Lỗi khi quản lý thành viên: ' + error.message }, { status: 500 })
  }
}

