import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'

// Lấy danh sách tất cả nhiệm vụ (Kiểm tra permission VIEW_TASKS)
export async function GET(request: NextRequest) {
  try {
    console.log('[GET /api/tasks] ========== START ==========')
    const user = await getJWT(request)
    console.log('[GET /api/tasks] JWT user:', { userId: user?.userId, username: user?.username, role: user?.role })
    
    if (!user || !user.role) {
      console.log('[GET /api/tasks] ❌ No user or role')
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    // Tìm userId đúng từ database
    let correctUserId = user.userId
    if (user.username) {
      const dbUser = await prisma.user.findUnique({
        where: { username: user.username },
        select: { id: true, username: true, role: true }
      })
      if (dbUser) {
        correctUserId = dbUser.id
        console.log('[GET /api/tasks] ✅ Found correct userId:', { 
          jwtUserId: user.userId, 
          correctUserId, 
          username: user.username,
          match: user.userId === correctUserId
        })
      } else {
        console.log('[GET /api/tasks] ❌ User not found in database:', user.username)
      }
    }
    
    // Admin luôn được phép
    if (user.role === 'admin') {
      console.log('[GET /api/tasks] ✅ Admin - bypassing permission check')
      // Continue below
    } else {
      // Kiểm tra quyền VIEW_TASKS (bao gồm cả đặc cách)
      console.log('[GET /api/tasks] 🔍 Checking permission VIEW_TASKS...')
      const canView = await hasUserPermission(user.userId, user.role, PERMISSIONS.VIEW_TASKS, user.username)
      console.log('[GET /api/tasks] 📊 Permission check result:', {
        jwtUserId: user.userId,
        correctUserId,
        username: user.username,
        role: user.role,
        permission: PERMISSIONS.VIEW_TASKS,
        canView
      })
      if (!canView) {
        console.log('[GET /api/tasks] ❌ Permission denied - returning 403')
        return NextResponse.json({ error: 'Bạn không có quyền xem danh sách nhiệm vụ' }, { status: 403 })
      }
      console.log('[GET /api/tasks] ✅ Permission granted')
    }

    // Lấy danh sách tasks với thống kê trong một query duy nhất (tối ưu hơn)
    console.log('[GET /api/tasks] 📥 Fetching tasks from database...')
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

    console.log('[GET /api/tasks] ✅ Returning tasks:', { count: tasksWithStats.length })
    console.log('[GET /api/tasks] ========== END ==========')
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
    
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    // Kiểm tra quyền CREATE_TASKS (bao gồm cả đặc cách)
    const canCreate = await hasUserPermission(user.userId, user.role, PERMISSIONS.CREATE_TASKS, user.username)
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

