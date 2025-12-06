import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// Lấy dữ liệu tổng hợp kết quả thực hiện nhiệm vụ
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xem kết quả' }, { status: 403 })
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        customers: {
          orderBy: { stt: 'asc' }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Không tìm thấy nhiệm vụ' }, { status: 404 })
    }

    // Lấy danh sách unique usernames từ customers
    const usernameSet = new Set<string>()
    task.customers.forEach(c => {
      if (c.assignedUsername) {
        usernameSet.add(c.assignedUsername)
      }
    })
    const usernames = Array.from(usernameSet)

    // Fetch thông tin fullName của users
    const users = await prisma.user.findMany({
      where: {
        username: { in: usernames }
      },
      select: {
        username: true,
        fullName: true
      }
    })

    // Tạo map username -> fullName (nếu không có fullName thì dùng username)
    const usernameToFullName = new Map<string, string>()
    users.forEach(user => {
      usernameToFullName.set(user.username, user.fullName || user.username)
    })

    // Helper function để lấy tên hiển thị
    const getDisplayName = (username: string | null): string => {
      if (!username || username === 'Chưa gán') return 'Chưa gán'
      return usernameToFullName.get(username) || username
    }

    // Tạo dữ liệu tổng hợp theo user
    const summaryMap = new Map<string, { total: number; completed: number; pending: number }>()
    
    task.customers.forEach(customer => {
      const username = customer.assignedUsername || 'Chưa gán'
      if (!summaryMap.has(username)) {
        summaryMap.set(username, { total: 0, completed: 0, pending: 0 })
      }
      const stats = summaryMap.get(username)!
      stats.total++
      if (customer.isCompleted) {
        stats.completed++
      } else {
        stats.pending++
      }
    })

    // Chuyển Map thành mảng và sắp xếp theo tên user
    const summaryData = Array.from(summaryMap.entries())
      .map(([username, stats]) => ({
        'Tên NV': getDisplayName(username),
        'Số lượng KH phân giao': stats.total,
        'Đã thực hiện': stats.completed,
        'Chưa thực hiện': stats.pending,
      }))
      .sort((a, b) => {
        // Sắp xếp: "Chưa gán" ở cuối, còn lại theo tên
        if (a['Tên NV'] === 'Chưa gán') return 1
        if (b['Tên NV'] === 'Chưa gán') return -1
        return a['Tên NV'].localeCompare(b['Tên NV'])
      })
      .map((item, index) => ({
        'STT': index + 1,
        ...item
      }))

    return NextResponse.json({
      taskName: task.name,
      summary: summaryData
    })
  } catch (error: any) {
    console.error('Error fetching summary:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy dữ liệu tổng hợp' }, { status: 500 })
  }
}

