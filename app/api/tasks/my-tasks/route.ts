import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// Lấy danh sách nhiệm vụ của người dùng hiện tại
export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Lấy user từ database để có id
    const userFromDb = await prisma.user.findUnique({
      where: { username: user.username },
      select: { id: true }
    })

    if (!userFromDb) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }

    // Lấy các nhiệm vụ được gán cho user này
    const assignments = await prisma.taskAssignment.findMany({
      where: { userId: userFromDb.id },
      include: {
        task: {
          include: {
            _count: {
              select: {
                customers: true
              }
            }
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    })

    // Thêm thống kê cho mỗi nhiệm vụ
    const tasksWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        const myCustomers = await prisma.taskCustomer.findMany({
          where: {
            taskId: assignment.taskId,
            assignedUserId: userFromDb.id
          }
        })

        const completedCount = myCustomers.filter(c => c.isCompleted).length
        const totalCount = myCustomers.length

        return {
          ...assignment.task,
          completedCount,
          totalCount,
          pendingCount: totalCount - completedCount,
          assignedAt: assignment.assignedAt
        }
      })
    )

    return NextResponse.json({ tasks: tasksWithStats })
  } catch (error: any) {
    console.error('Error fetching my tasks:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách nhiệm vụ' }, { status: 500 })
  }
}

