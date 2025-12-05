import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// Lấy chi tiết nhiệm vụ
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Kiểm tra query parameter để xem có cần load customers không
    const { searchParams } = new URL(request.url)
    const includeCustomers = searchParams.get('includeCustomers') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000') // Mặc định 1000, có thể tăng nếu cần
    const skip = (page - 1) * limit
    
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        // Chỉ load customers nếu được yêu cầu (khi mở modal xem danh sách)
        ...(includeCustomers && {
          customers: {
            orderBy: { stt: 'asc' },
            skip: skip,
            take: limit,
            // Chỉ select fields cần thiết để giảm dữ liệu transfer
            select: {
              id: true,
              stt: true,
              account: true,
              customerName: true,
              address: true,
              phone: true,
              assignedUserId: true,
              assignedUsername: true,
              isCompleted: true,
              completedAt: true,
              completedBy: true
            }
          }
        }),
        assignments: {
          include: {
            user: {
              select: { id: true, username: true, fullName: true }
            }
          }
        }
      }
    })
    
    // Nếu có includeCustomers, thêm thông tin pagination
    let customerCount = null
    if (includeCustomers) {
      customerCount = await prisma.taskCustomer.count({
        where: { taskId: params.id }
      })
    }

    if (!task) {
      return NextResponse.json({ error: 'Không tìm thấy nhiệm vụ' }, { status: 404 })
    }

    return NextResponse.json({ 
      task,
      ...(includeCustomers && customerCount !== null && {
        pagination: {
          total: customerCount,
          page,
          limit,
          totalPages: Math.ceil(customerCount / limit)
        }
      })
    })
  } catch (error: any) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy thông tin nhiệm vụ' }, { status: 500 })
  }
}

// Cập nhật nhiệm vụ (Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được cập nhật nhiệm vụ' }, { status: 403 })
    }

    const { name, description, isActive, startDate, endDate, dailyAssignmentCount } = await request.json()

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(dailyAssignmentCount !== undefined && { dailyAssignmentCount }),
      }
    })

    return NextResponse.json({ task })
  } catch (error: any) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Lỗi khi cập nhật nhiệm vụ' }, { status: 500 })
  }
}

// Xóa nhiệm vụ (Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xóa nhiệm vụ' }, { status: 403 })
    }

    await prisma.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Lỗi khi xóa nhiệm vụ' }, { status: 500 })
  }
}

