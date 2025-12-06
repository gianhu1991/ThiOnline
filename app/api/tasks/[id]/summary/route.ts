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

    // Lấy query parameter date (format: YYYY-MM-DD)
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    // Lấy tất cả customers của task (không lọc theo date ở đây)
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

    // Xử lý date nếu có (lưu dạng string YYYY-MM-DD để so sánh)
    const selectedDateStr = dateParam || null

    // Tạo dữ liệu tổng hợp theo user
    const summaryMap = new Map<string, { total: number; completed: number; pending: number }>()
    
    task.customers.forEach(customer => {
      const username = customer.assignedUsername || 'Chưa gán'
      if (!summaryMap.has(username)) {
        summaryMap.set(username, { total: 0, completed: 0, pending: 0 })
      }
      const stats = summaryMap.get(username)!
      stats.total++ // Tổng số KH phân giao
      
      if (customer.isCompleted) {
        // Nếu có date filter, chỉ tính KH hoàn thành trong ngày đó
        if (selectedDateStr && customer.completedAt) {
          // So sánh string date (YYYY-MM-DD) để tránh timezone issues
          const completedDate = new Date(customer.completedAt)
          // Lấy year, month, day từ date object (sử dụng local time)
          const year = completedDate.getFullYear()
          const month = String(completedDate.getMonth() + 1).padStart(2, '0')
          const day = String(completedDate.getDate()).padStart(2, '0')
          const completedDateStr = `${year}-${month}-${day}`
          
          if (completedDateStr === selectedDateStr) {
            stats.completed++
          }
        } else if (!selectedDateStr) {
          // Không có date filter, tính tất cả KH đã hoàn thành
          stats.completed++
        }
      }
    })
    
    // Tính pending = total - tổng số đã hoàn thành (không phụ thuộc ngày)
    summaryMap.forEach((stats, username) => {
      const totalCompleted = task.customers.filter(c => 
        (c.assignedUsername || 'Chưa gán') === username && c.isCompleted
      ).length
      stats.pending = stats.total - totalCompleted
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

