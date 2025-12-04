import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { isSuperAdminByUsername } from '@/lib/super-admin'

// Phân giao lại khách hàng (Super Admin)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Kiểm tra super admin
    const isSuperAdmin = await isSuperAdminByUsername(user.username)

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Chỉ Super Admin mới được phân giao lại' }, { status: 403 })
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

      const pendingCustomers = task.customers
      const assignedUsers = task.assignments.map(a => a.user)
      
      // Phân giao đều cho các user được gán
      let userIndex = 0
      for (let i = 0; i < pendingCustomers.length; i += dailyCount) {
        const batch = pendingCustomers.slice(i, i + dailyCount)
        const assignedUser = assignedUsers[userIndex % assignedUsers.length]
        
        await prisma.taskCustomer.updateMany({
          where: {
            id: { in: batch.map(c => c.id) }
          },
          data: {
            assignedUserId: assignedUser.id,
            assignedUsername: assignedUser.username,
          }
        })

        userIndex++
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

