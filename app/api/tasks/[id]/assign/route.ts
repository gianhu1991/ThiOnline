import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// Gán nhiệm vụ cho người dùng (Super Admin)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Kiểm tra super admin
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })

    if (firstUser?.id !== user.userId) {
      return NextResponse.json({ error: 'Chỉ Super Admin mới được gán nhiệm vụ' }, { status: 403 })
    }

    const { userIds } = await request.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Vui lòng chọn ít nhất một người dùng' }, { status: 400 })
    }

    // Kiểm tra nhiệm vụ tồn tại
    const task = await prisma.task.findUnique({
      where: { id: params.id }
    })

    if (!task) {
      return NextResponse.json({ error: 'Không tìm thấy nhiệm vụ' }, { status: 404 })
    }

    // Kiểm tra users tồn tại
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true }
    })

    if (users.length !== userIds.length) {
      return NextResponse.json({ error: 'Một số người dùng không tồn tại' }, { status: 400 })
    }

    // Gán nhiệm vụ cho các user
    const assignments = await Promise.all(
      users.map(assignedUser =>
        prisma.taskAssignment.upsert({
          where: {
            taskId_userId: {
              taskId: params.id,
              userId: assignedUser.id
            }
          },
          create: {
            taskId: params.id,
            userId: assignedUser.id,
            assignedBy: user.username, // Username của Super Admin đang gán (từ JWT)
          },
          update: {
            assignedBy: user.username, // Username của Super Admin đang gán (từ JWT)
          }
        })
      )
    )

    return NextResponse.json({ 
      success: true, 
      message: `Đã gán nhiệm vụ cho ${assignments.length} người dùng`,
      assignments 
    })
  } catch (error: any) {
    console.error('Error assigning task:', error)
    return NextResponse.json({ error: 'Lỗi khi gán nhiệm vụ: ' + error.message }, { status: 500 })
  }
}

// Xóa gán nhiệm vụ
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Kiểm tra super admin
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })

    if (firstUser?.id !== user.userId) {
      return NextResponse.json({ error: 'Chỉ Super Admin mới được xóa gán nhiệm vụ' }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 })
    }

    await prisma.taskAssignment.delete({
      where: {
        taskId_userId: {
          taskId: params.id,
          userId: userId
        }
      }
    })

    return NextResponse.json({ success: true, message: 'Đã xóa gán nhiệm vụ' })
  } catch (error: any) {
    console.error('Error unassigning task:', error)
    return NextResponse.json({ error: 'Lỗi khi xóa gán nhiệm vụ' }, { status: 500 })
  }
}

