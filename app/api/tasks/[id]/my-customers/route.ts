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

    // Lấy query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Xây dựng điều kiện where
    // Lấy TẤT CẢ KH được gán cho user này (không phân biệt ngày phân giao)
    // CHỈ lấy KH chưa hoàn thành (isCompleted = false)
    const whereCondition: any = {
      taskId: params.id,
      assignedUserId: userFromDb.id,
      isCompleted: false // CHỈ lấy KH chưa hoàn thành
    }

    // Thêm điều kiện tìm kiếm nếu có
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim()
      whereCondition.AND = [
        {
          OR: [
            { customerName: { contains: searchLower, mode: 'insensitive' } },
            { account: { contains: searchLower, mode: 'insensitive' } },
            { phone: { contains: searchLower, mode: 'insensitive' } },
            { address: { contains: searchLower, mode: 'insensitive' } }
          ]
        }
      ]
    }

    // Lấy tổng số KH (để tính pagination)
    const totalCustomers = await prisma.taskCustomer.count({
      where: whereCondition
    })

    // Lấy danh sách khách hàng với pagination
    const customers = await prisma.taskCustomer.findMany({
      where: whereCondition,
      orderBy: { stt: 'asc' },
      skip,
      take: limit
    })

    // Lấy thống kê
    const completedCount = await prisma.taskCustomer.count({
      where: {
        taskId: params.id,
        assignedUserId: userFromDb.id,
        isCompleted: true
      }
    })

    return NextResponse.json({ 
      task: {
        id: task.id,
        name: task.name,
        description: task.description,
        isActive: task.isActive
      },
      customers,
      pagination: {
        page,
        limit,
        total: totalCustomers,
        totalPages: Math.ceil(totalCustomers / limit)
      },
      stats: {
        total: totalCustomers,
        completed: completedCount,
        pending: totalCustomers
      }
    })
  } catch (error: any) {
    console.error('Error fetching my customers:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách khách hàng' }, { status: 500 })
  }
}

