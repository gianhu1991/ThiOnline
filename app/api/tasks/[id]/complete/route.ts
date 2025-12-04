import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// Đánh dấu hoàn thành khách hàng
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: 'Thiếu customerId' }, { status: 400 })
    }

    // Lấy user từ database
    const userFromDb = await prisma.user.findUnique({
      where: { username: user.username },
      select: { id: true }
    })

    if (!userFromDb) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }

    // Kiểm tra khách hàng có thuộc về user này không
    const customer = await prisma.taskCustomer.findUnique({
      where: { id: customerId },
      include: {
        task: true
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 })
    }

    if (customer.taskId !== params.id) {
      return NextResponse.json({ error: 'Khách hàng không thuộc nhiệm vụ này' }, { status: 400 })
    }

    if (customer.assignedUserId !== userFromDb.id) {
      return NextResponse.json({ error: 'Bạn không được gán khách hàng này' }, { status: 403 })
    }

    if (!customer.task.isActive) {
      return NextResponse.json({ error: 'Nhiệm vụ đã bị tắt' }, { status: 400 })
    }

    // Đánh dấu hoàn thành
    await prisma.taskCustomer.update({
      where: { id: customerId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        completedBy: user.username,
      }
    })

    return NextResponse.json({ success: true, message: 'Đã đánh dấu hoàn thành' })
  } catch (error: any) {
    console.error('Error completing customer:', error)
    return NextResponse.json({ error: 'Lỗi khi đánh dấu hoàn thành: ' + error.message }, { status: 500 })
  }
}

