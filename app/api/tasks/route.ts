import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'

// Lấy danh sách tất cả nhiệm vụ (Admin và Leader)
export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    // Cho phép admin và leader xem danh sách nhiệm vụ
    if (!user || (user.role !== 'admin' && user.role !== 'leader')) {
      return NextResponse.json({ error: 'Chỉ admin và leader mới được truy cập' }, { status: 403 })
    }

    // Lấy danh sách tasks với thống kê trong một query duy nhất (tối ưu hơn)
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        startDate: true,
        endDate: true,
        dailyAssignmentCount: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            customers: true,
            assignments: true,
          }
        }
      }
    })

    // Lấy thống kê cho tất cả tasks trong một query duy nhất (tối ưu hơn nhiều)
    const taskIds = tasks.map(t => t.id)
    
    // Sử dụng groupBy để lấy thống kê cho tất cả tasks cùng lúc
    const stats = await prisma.taskCustomer.groupBy({
      by: ['taskId', 'isCompleted'],
      where: {
        taskId: { in: taskIds }
      },
      _count: {
        id: true
      }
    })

    // Tạo map để tra cứu nhanh
    const statsMap = new Map<string, { completed: number, total: number }>()
    
    // Khởi tạo map với 0 cho tất cả tasks
    taskIds.forEach(id => {
      statsMap.set(id, { completed: 0, total: 0 })
    })
    
    // Cập nhật stats từ kết quả groupBy
    stats.forEach(stat => {
      const current = statsMap.get(stat.taskId) || { completed: 0, total: 0 }
      current.total += stat._count.id
      if (stat.isCompleted) {
        current.completed += stat._count.id
      }
      statsMap.set(stat.taskId, current)
    })

    // Kết hợp tasks với stats
    const tasksWithStats = tasks.map(task => {
      const taskStats = statsMap.get(task.id) || { completed: 0, total: 0 }
      return {
        ...task,
        completedCount: taskStats.completed,
        totalCount: taskStats.total,
        pendingCount: taskStats.total - taskStats.completed
      }
    })

    return NextResponse.json({ tasks: tasksWithStats })
  } catch (error: any) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách nhiệm vụ' }, { status: 500 })
  }
}

// Tạo nhiệm vụ mới (Kiểm tra permission)
export async function POST(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    // Kiểm tra quyền CREATE_TASKS (bao gồm cả đặc cách)
    const canCreate = await hasUserPermission(user.userId, user.role, PERMISSIONS.CREATE_TASKS)
    if (!canCreate) {
      return NextResponse.json({ error: 'Bạn không có quyền tạo nhiệm vụ' }, { status: 403 })
    }

    const { name, description, startDate, endDate, dailyAssignmentCount } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Tên nhiệm vụ không được để trống' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        name,
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        dailyAssignmentCount: dailyAssignmentCount || 0,
        createdBy: user.username,
        isActive: true,
      }
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Lỗi khi tạo nhiệm vụ' }, { status: 500 })
  }
}

