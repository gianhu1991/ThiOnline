import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// Gán nhiệm vụ cho người dùng (Admin)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được gán nhiệm vụ' }, { status: 403 })
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

    // Tự động phân giao các KH chưa được gán cho các user đã được gán nhiệm vụ
    // Logic: TUÂN THEO PHÂN GIAO TRONG FILE EXCEL
    // 1. Nếu KH đã được gán trong Excel (assignedUserId != null) -> GIỮ NGUYÊN, không phân giao lại
    // 2. Nếu KH chưa được gán trong Excel (assignedUserId = null) -> phân giao đều cho các user đã được gán task
    // 3. Phân giao trong Excel là nguồn gốc, không được thay đổi
    let autoAssignedCount = 0
    
    // Lấy tất cả user đã được gán nhiệm vụ (bao gồm cả user mới gán)
    const allTaskAssignments = await prisma.taskAssignment.findMany({
      where: { taskId: params.id },
      include: {
        user: {
          select: { id: true, username: true }
        }
      }
    })

    if (allTaskAssignments.length > 0) {
      const assignedUserIds = new Set(allTaskAssignments.map(a => a.user.id))
      const assignedUsers = allTaskAssignments.map(a => a.user)
      
      // CHỈ lấy các KH chưa được gán trong Excel (assignedUserId = null)
      // KH đã được gán trong Excel (assignedUserId != null) sẽ được GIỮ NGUYÊN
      const unassignedCustomers = await prisma.taskCustomer.findMany({
        where: {
          taskId: params.id,
          assignedUserId: null, // CHỈ phân giao KH chưa được gán trong Excel
          isCompleted: false
        },
        orderBy: { stt: 'asc' } // Tuân theo thứ tự trong Excel
      })

      if (unassignedCustomers.length > 0) {
        // Phân giao đều cho các user (round-robin) - tuân theo thứ tự trong Excel (stt)
        for (let i = 0; i < unassignedCustomers.length; i++) {
          const customer = unassignedCustomers[i]
          const assignedUser = assignedUsers[i % assignedUsers.length]
          
          await prisma.taskCustomer.update({
            where: { id: customer.id },
            data: {
              assignedUserId: assignedUser.id,
              assignedUsername: assignedUser.username,
              assignedAt: null // Chưa phân giao theo ngày, sẽ được phân giao khi chạy "Phân giao lại"
            }
          })
          autoAssignedCount++
        }
      }
      
      // KH đã được gán trong Excel (assignedUserId != null) sẽ được GIỮ NGUYÊN
      // Khi user được gán task, họ sẽ thấy các KH đã được gán cho họ trong Excel
      // Không cần làm gì thêm - phân giao trong Excel là nguồn gốc
    }

    // Tạo thông báo chi tiết
    let message = `Đã gán nhiệm vụ cho ${assignments.length} người dùng`
    if (autoAssignedCount > 0) {
      message += `. Đã tự động phân giao ${autoAssignedCount} khách hàng chưa được gán cho các nhân viên`
    }

    return NextResponse.json({ 
      success: true, 
      message,
      assignments,
      autoAssignedCustomers: autoAssignedCount
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
      return NextResponse.json({ error: 'Chỉ admin mới được xóa gán nhiệm vụ' }, { status: 403 })
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

