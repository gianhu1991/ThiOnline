import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'

// Phân giao lại khách hàng (Admin)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    const canAssign = await hasUserPermission(user.userId, user.role, PERMISSIONS.ASSIGN_TASKS)
    if (!canAssign) {
      return NextResponse.json({ error: 'Bạn không có quyền phân giao nhiệm vụ' }, { status: 403 })
    }

    const { customerId, newUserId, dailyCount } = await request.json()

    if (customerId && newUserId) {
      // Phân giao lại 1 khách hàng cụ thể
      const newUser = await prisma.user.findUnique({
        where: { id: newUserId },
        select: { id: true, username: true }
      })

      if (!newUser) {
        return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
      }

      await prisma.taskCustomer.update({
        where: { id: customerId },
        data: {
          assignedUserId: newUser.id,
          assignedUsername: newUser.username,
          assignedAt: new Date(), // Lưu thời gian phân giao
        }
      })

      return NextResponse.json({ success: true, message: 'Đã phân giao lại thành công' })
    } else if (dailyCount) {
      // Phân giao tự động theo số lượng hàng ngày
      const task = await prisma.task.findUnique({
        where: { id: params.id },
        include: {
          customers: {
            where: { isCompleted: false },
            orderBy: { stt: 'asc' }
          },
          assignments: {
            include: {
              user: {
                select: { id: true, username: true }
              }
            }
          }
        }
      })

      if (!task) {
        return NextResponse.json({ error: 'Không tìm thấy nhiệm vụ' }, { status: 404 })
      }

      if (task.assignments.length === 0) {
        return NextResponse.json({ error: 'Nhiệm vụ chưa được gán cho người dùng nào' }, { status: 400 })
      }

      // Lấy KH chưa hoàn thành và chưa được phân giao hôm nay
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const assignedUsers = task.assignments.map(a => a.user)
      
      // Lưu danh sách KH đã được phân giao hôm nay (để không reset chúng)
      const todayAssignedCustomerIds = new Set<string>()
      const todayAssignedCustomers = task.customers.filter(c => {
        if (!c.assignedAt || c.isCompleted) return false
        const assignedDate = new Date(c.assignedAt)
        assignedDate.setHours(0, 0, 0, 0)
        return assignedDate.getTime() === today.getTime()
      })
      todayAssignedCustomers.forEach(c => todayAssignedCustomerIds.add(c.id))
      
      // Phân giao đều cho các user được gán: mỗi user nhận dailyCount KH từ TẬP KH ĐÃ ĐƯỢC GÁN CHO USER ĐÓ
      const newlyAssignedCustomerIds = new Set<string>()
      
      console.log(`[Reassign] Bắt đầu phân giao lại cho ${assignedUsers.length} users, dailyCount=${dailyCount}`)
      console.log(`[Reassign] Tổng số KH chưa hoàn thành: ${task.customers.length}`)
      
      for (let userIndex = 0; userIndex < assignedUsers.length; userIndex++) {
        const assignedUser = assignedUsers[userIndex]
        
        // Chỉ lấy các KH đã được gán cho user này (assignedUserId = user.id)
        const userCustomers = task.customers.filter(c => 
          c.assignedUserId === assignedUser.id && !c.isCompleted
        )
        
        console.log(`[Reassign] User ${assignedUser.username}: có ${userCustomers.length} KH đã được gán`)
        
        // Lọc KH chưa được phân giao hôm nay (chưa có assignedAt hoặc assignedAt < hôm nay)
        const customersToAssign = userCustomers.filter(c => {
          if (!c.assignedAt) return true // Chưa được phân giao bao giờ
          
          const assignedDate = new Date(c.assignedAt)
          assignedDate.setHours(0, 0, 0, 0)
          const assignedTime = assignedDate.getTime()
          const todayTime = today.getTime()
          
          // Chỉ lấy KH được phân giao TRƯỚC hôm nay (không phải hôm nay)
          return assignedTime < todayTime
        })
        
        console.log(`[Reassign] User ${assignedUser.username}: có ${customersToAssign.length} KH chưa được phân giao hôm nay`)
        
        // Lấy ngẫu nhiên dailyCount KH từ tập KH của user này
        // Shuffle array để lấy ngẫu nhiên
        const shuffled = [...customersToAssign].sort(() => Math.random() - 0.5)
        const batch = shuffled.slice(0, dailyCount)
        
        console.log(`[Reassign] User ${assignedUser.username}: sẽ phân giao ${batch.length} KH (yêu cầu: ${dailyCount})`)
        
        if (batch.length > 0) {
          const batchIds = batch.map(c => c.id)
          batchIds.forEach(id => newlyAssignedCustomerIds.add(id))
          
          // CHỈ cập nhật assignedAt, KHÔNG cập nhật assignedUserId và assignedUsername
          // vì chúng đã đúng từ Excel và phải tuân thủ chính xác như Excel
          const updateResult = await prisma.taskCustomer.updateMany({
            where: {
              id: { in: batchIds },
              assignedUserId: assignedUser.id // Đảm bảo chỉ cập nhật KH đã được gán cho user này
            },
            data: {
              assignedAt: new Date(), // Chỉ cập nhật thời gian phân giao
            }
          })
          
          console.log(`[Reassign] User ${assignedUser.username}: đã cập nhật ${updateResult.count} KH`)
        } else {
          console.log(`[Reassign] User ${assignedUser.username}: không có KH nào để phân giao`)
        }
      }
      
      console.log(`[Reassign] Tổng số KH được phân giao: ${newlyAssignedCustomerIds.size}`)
      
      // Reset assignedAt = null CHỈ cho các KH có assignedAt hôm nay nhưng:
      // 1. KHÔNG được phân giao đúng trong ngày (không có trong todayAssignedCustomerIds)
      // 2. KHÔNG được phân giao mới trong lần này (không có trong newlyAssignedCustomerIds)
      // (Để tránh hiển thị nhầm các KH từ migration hoặc phân giao sai)
      const allValidCustomerIds = new Set<string>()
      todayAssignedCustomerIds.forEach(id => allValidCustomerIds.add(id))
      newlyAssignedCustomerIds.forEach(id => allValidCustomerIds.add(id))
      
      await prisma.taskCustomer.updateMany({
        where: {
          taskId: params.id,
          isCompleted: false,
          assignedAt: {
            gte: today,
            lt: tomorrow
          },
          id: {
            notIn: Array.from(allValidCustomerIds)
          }
        },
        data: {
          assignedAt: null
        }
      })

      const totalAssigned = newlyAssignedCustomerIds.size
      
      if (totalAssigned === 0) {
        // Kiểm tra xem có KH nào để phân giao không
        const totalCustomers = task.customers.length
        const totalAssignedCustomers = task.customers.filter(c => c.assignedUserId !== null).length
        
        console.log(`[Reassign] Không có KH nào được phân giao. Tổng KH: ${totalCustomers}, KH đã được gán: ${totalAssignedCustomers}`)
        
        return NextResponse.json({ 
          success: true, 
          message: `Không có khách hàng nào để phân giao. Tất cả khách hàng đã được phân giao hôm nay hoặc chưa được gán cho nhân viên nào.` 
        })
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Đã phân giao ${totalAssigned} khách hàng cho ${assignedUsers.length} người dùng` 
      })
    } else {
      return NextResponse.json({ error: 'Thiếu thông tin phân giao' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error reassigning:', error)
    return NextResponse.json({ error: 'Lỗi khi phân giao lại: ' + error.message }, { status: 500 })
  }
}

