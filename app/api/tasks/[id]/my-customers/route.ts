import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// Lấy danh sách khách hàng của nhiệm vụ được gán cho user hiện tại
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Lấy user từ database
    const userFromDb = await prisma.user.findUnique({
      where: { username: user.username },
      select: { id: true }
    })

    if (!userFromDb) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }

    // Kiểm tra user có được gán nhiệm vụ này không
    const assignment = await prisma.taskAssignment.findUnique({
      where: {
        taskId_userId: {
          taskId: params.id,
          userId: userFromDb.id
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Bạn không được gán nhiệm vụ này' }, { status: 403 })
    }

    // Lấy nhiệm vụ
    const task = await prisma.task.findUnique({
      where: { id: params.id }
    })

    if (!task) {
      return NextResponse.json({ error: 'Không tìm thấy nhiệm vụ' }, { status: 404 })
    }

    if (!task.isActive) {
      return NextResponse.json({ error: 'Nhiệm vụ đã bị tắt' }, { status: 400 })
    }

    // Lấy danh sách khách hàng được gán cho user này
    const customers = await prisma.taskCustomer.findMany({
      where: {
        taskId: params.id,
        assignedUserId: userFromDb.id
      },
      orderBy: { stt: 'asc' }
    })

    return NextResponse.json({ 
      task: {
        id: task.id,
        name: task.name,
        description: task.description,
        isActive: task.isActive
      },
      customers 
    })
  } catch (error: any) {
    console.error('Error fetching my customers:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách khách hàng' }, { status: 500 })
  }
}

