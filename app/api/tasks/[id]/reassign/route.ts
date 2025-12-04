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
      
      // Lọc KH chưa được phân giao hôm nay (assignedAt không phải hôm nay hoặc null)
      const customersToAssign = task.customers.filter(c => {
        if (!c.assignedAt) return true // Chưa được phân giao bao giờ
        const assignedDate = new Date(c.assignedAt)
        assignedDate.setHours(0, 0, 0, 0)
        return assignedDate.getTime() < today.getTime() // Được phân giao trước hôm nay
      })
      
      const assignedUsers = task.assignments.map(a => a.user)
      
      // Phân giao đều cho các user được gán: mỗi user nhận dailyCount KH
      let customerIndex = 0
      for (let userIndex = 0; userIndex < assignedUsers.length; userIndex++) {
        const assignedUser = assignedUsers[userIndex]
        const batch = customersToAssign.slice(customerIndex, customerIndex + dailyCount)
        
        if (batch.length > 0) {
          await prisma.taskCustomer.updateMany({
            where: {
              id: { in: batch.map(c => c.id) }
            },
            data: {
              assignedUserId: assignedUser.id,
              assignedUsername: assignedUser.username,
              assignedAt: new Date(), // Lưu thời gian phân giao
            }
          })
        }
        
        customerIndex += dailyCount
      }

      return NextResponse.json({ 
        success: true, 
        message: `Đã phân giao ${pendingCustomers.length} khách hàng cho ${assignedUsers.length} người dùng` 
      })
    } else {
      return NextResponse.json({ error: 'Thiếu thông tin phân giao' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error reassigning:', error)
    return NextResponse.json({ error: 'Lỗi khi phân giao lại: ' + error.message }, { status: 500 })
  }
}

