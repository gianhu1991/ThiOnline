import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// API để cập nhật lại assignedUsername cho các customers dựa trên assignedUserId
// Dùng để fix dữ liệu cũ đã được upload trước khi có logic lưu username thực tế
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được sử dụng tính năng này' }, { status: 403 })
    }

    // Lấy tất cả customers của task này có assignedUserId nhưng assignedUsername có thể không đúng
    const customers = await prisma.taskCustomer.findMany({
      where: {
        taskId: params.id,
        assignedUserId: { not: null }
      },
      select: {
        id: true,
        assignedUserId: true,
        assignedUsername: true
      }
    })

    // Lấy tất cả users để tạo map
    const allUsers = await prisma.user.findMany({
      select: { id: true, username: true }
    })
    const userMap = new Map<string, string>() // userId -> username
    allUsers.forEach(u => {
      userMap.set(u.id, u.username)
    })

    let updatedCount = 0
    let skippedCount = 0

    // Cập nhật assignedUsername cho các customers
    for (const customer of customers) {
      if (!customer.assignedUserId) continue
      
      const actualUsername = userMap.get(customer.assignedUserId)
      
      if (actualUsername && actualUsername !== customer.assignedUsername) {
        // Cập nhật assignedUsername với username thực tế từ database
        await prisma.taskCustomer.update({
          where: { id: customer.id },
          data: {
            assignedUsername: actualUsername
          }
        })
        updatedCount++
      } else {
        skippedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật ${updatedCount} khách hàng, bỏ qua ${skippedCount} khách hàng`,
      updated: updatedCount,
      skipped: skippedCount,
      total: customers.length
    })
  } catch (error: any) {
    console.error('Error fixing assigned usernames:', error)
    return NextResponse.json({ error: 'Lỗi khi cập nhật: ' + error.message }, { status: 500 })
  }
}

