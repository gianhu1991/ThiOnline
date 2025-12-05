import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// Phân giao lại khách hàng (Admin)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được phân giao lại' }, { status: 403 })
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
      
      for (let userIndex = 0; userIndex < assignedUsers.length; userIndex++) {
        const assignedUser = assignedUsers[userIndex]
        
        // Chỉ lấy các KH đã được gán cho user này (assignedUserId = user.id)
        const userCustomers = task.customers.filter(c => 
          c.assignedUserId === assignedUser.id && !c.isCompleted
        )
        
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
        
        // Lấy ngẫu nhiên dailyCount KH từ tập KH của user này
        // Shuffle array để lấy ngẫu nhiên
        const shuffled = [...customersToAssign].sort(() => Math.random() - 0.5)
        const batch = shuffled.slice(0, dailyCount)
        
        if (batch.length > 0) {
          const batchIds = batch.map(c => c.id)
          batchIds.forEach(id => newlyAssignedCustomerIds.add(id))
          
          // CHỈ cập nhật assignedAt, KHÔNG cập nhật assignedUserId và assignedUsername
          // vì chúng đã đúng từ Excel và phải tuân thủ chính xác như Excel
          await prisma.taskCustomer.updateMany({
            where: {
              id: { in: batchIds },
              assignedUserId: assignedUser.id // Đảm bảo chỉ cập nhật KH đã được gán cho user này
            },
            data: {
              assignedAt: new Date(), // Chỉ cập nhật thời gian phân giao
            }
          })
        }
      }
      
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

