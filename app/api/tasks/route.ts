import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { isSuperAdminByUsername } from '@/lib/super-admin'

// Lấy danh sách tất cả nhiệm vụ (Super Admin)
export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Kiểm tra super admin
    const isSuperAdmin = await isSuperAdminByUsername(user.username)

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Chỉ Super Admin mới được truy cập' }, { status: 403 })
    }

    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            customers: true,
            assignments: true,
          }
        }
      }
    })

    // Thêm thống kê số lượng KH đã/chưa hoàn thành
    const tasksWithStats = await Promise.all(
      tasks.map(async (task) => {
        const completedCount = await prisma.taskCustomer.count({
          where: { taskId: task.id, isCompleted: true }
        })
        const totalCount = await prisma.taskCustomer.count({
          where: { taskId: task.id }
        })
        
        return {
          ...task,
          completedCount,
          totalCount,
          pendingCount: totalCount - completedCount
        }
      })
    )

    return NextResponse.json({ tasks: tasksWithStats })
  } catch (error: any) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách nhiệm vụ' }, { status: 500 })
  }
}

// Tạo nhiệm vụ mới (Super Admin)
export async function POST(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Kiểm tra super admin
    const isSuperAdmin = await isSuperAdminByUsername(user.username)

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Chỉ Super Admin mới được tạo nhiệm vụ' }, { status: 403 })
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

