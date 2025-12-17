import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'

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
    // Phân trang: mỗi trang 50 khách hàng
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || '' // Thêm parameter search
    
    // Xây dựng điều kiện where cho search
    let customerWhere: any = {
      taskId: params.id
    }
    
    if (search.trim()) {
      const searchTerm = search.trim()
      customerWhere.OR = [
        { customerName: { contains: searchTerm, mode: 'insensitive' } },
        { account: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
        { address: { contains: searchTerm, mode: 'insensitive' } },
        { assignedUsername: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }
    
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        // Chỉ load customers nếu được yêu cầu (khi mở modal xem danh sách)
        ...(includeCustomers && {
          customers: {
            where: customerWhere, // Thêm điều kiện search
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
    
    // Nếu có includeCustomers, thêm thông tin pagination và thống kê
    let customerCount = null
    let completedCount = 0
    let pendingCount = 0
    
    if (includeCustomers) {
      // Đếm tổng số customers (có thể có search filter)
      customerCount = await prisma.taskCustomer.count({
        where: customerWhere
      })
      
      // Lấy thống kê completed và pending (không áp dụng search filter cho thống kê)
      const [completed, pending] = await Promise.all([
        prisma.taskCustomer.count({
          where: { 
            taskId: params.id,
            isCompleted: true
          }
        }),
        prisma.taskCustomer.count({
          where: { 
            taskId: params.id,
            isCompleted: false
          }
        })
      ])
      
      completedCount = completed
      pendingCount = pending
    }

    if (!task) {
      return NextResponse.json({ error: 'Không tìm thấy nhiệm vụ' }, { status: 404 })
    }

    return NextResponse.json({ 
      task,
      ...(includeCustomers && customerCount !== null && {
        pagination: {
          total: customerCount,
          completed: completedCount,
          pending: pendingCount,
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

// Cập nhật nhiệm vụ (Kiểm tra permission)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    const canEdit = await hasUserPermission(user.userId, user.role, PERMISSIONS.EDIT_TASKS)
    if (!canEdit) {
      return NextResponse.json({ error: 'Bạn không có quyền cập nhật nhiệm vụ' }, { status: 403 })
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

// Xóa nhiệm vụ (Kiểm tra permission)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    const canDelete = await hasUserPermission(user.userId, user.role, PERMISSIONS.DELETE_TASKS)
    if (!canDelete) {
      return NextResponse.json({ error: 'Bạn không có quyền xóa nhiệm vụ' }, { status: 403 })
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

