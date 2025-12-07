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

    // Lấy TẤT CẢ customers của task (không filter ở database level)
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        customers: {
          orderBy: { stt: 'asc' }
        }
      }
    })
    
    // Lấy TẤT CẢ customers để tính tổng số phân giao và pending (không phụ thuộc date filter)
    const allCustomers = await prisma.taskCustomer.findMany({
      where: { taskId: params.id },
      select: {
        assignedUsername: true,
        isCompleted: true
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
    
    // Tính tổng số KH phân giao và pending từ allCustomers (không phụ thuộc date filter)
    allCustomers.forEach(customer => {
      const username = customer.assignedUsername || 'Chưa gán'
      if (!summaryMap.has(username)) {
        summaryMap.set(username, { total: 0, completed: 0, pending: 0 })
      }
      const stats = summaryMap.get(username)!
      stats.total++ // Tổng số KH phân giao
      
      if (customer.isCompleted) {
        // Tính tổng số đã hoàn thành (không phụ thuộc date filter)
        // Pending sẽ được tính sau
      } else {
        stats.pending++ // Chưa hoàn thành
      }
    })
    
    // Tính số KH hoàn thành trong ngày được chọn
    if (dateParam) {
      // Parse date từ YYYY-MM-DD (ngày user chọn, theo timezone local của user - UTC+7 cho VN)
      const [year, month, day] = dateParam.split('-').map(Number)
      
      task.customers.forEach(customer => {
        const username = customer.assignedUsername || 'Chưa gán'
        if (summaryMap.has(username) && customer.isCompleted && customer.completedAt) {
          // completedAt được lưu ở UTC trong database
          // User chọn ngày theo timezone của họ (UTC+7 cho VN)
          // Ta cần convert completedAt từ UTC về UTC+7 để lấy ngày
          const completedDateUTC = new Date(customer.completedAt)
          
          // Convert UTC sang UTC+7 (giờ Việt Nam)
          // Thêm 7 giờ (7 * 60 * 60 * 1000 milliseconds)
          const completedDateVN = new Date(completedDateUTC.getTime() + 7 * 60 * 60 * 1000)
          
          // Lấy date components từ giờ VN
          const completedYear = completedDateVN.getUTCFullYear()
          const completedMonth = completedDateVN.getUTCMonth() + 1
          const completedDay = completedDateVN.getUTCDate()
          
          // So sánh với date được chọn
          if (completedYear === year && completedMonth === month && completedDay === day) {
            summaryMap.get(username)!.completed++
          }
        }
      })
    } else {
      // Không có date filter: tính tất cả KH đã hoàn thành
      task.customers.forEach(customer => {
        const username = customer.assignedUsername || 'Chưa gán'
        if (summaryMap.has(username) && customer.isCompleted) {
          summaryMap.get(username)!.completed++
        }
      })
    }
    
    // Nếu không có date filter, tính completed từ allCustomers
    if (!dateParam) {
      summaryMap.forEach((stats, username) => {
        const totalCompleted = allCustomers.filter(c => 
          (c.assignedUsername || 'Chưa gán') === username && c.isCompleted
        ).length
        stats.completed = totalCompleted
        // Cập nhật lại pending = total - completed
        stats.pending = stats.total - totalCompleted
      })
    } else {
      // Có date filter: completed đã được tính từ task.customers (đã filter)
      // Pending = total - tổng số đã hoàn thành (không phụ thuộc ngày)
      summaryMap.forEach((stats, username) => {
        const totalCompleted = allCustomers.filter(c => 
          (c.assignedUsername || 'Chưa gán') === username && c.isCompleted
        ).length
        stats.pending = stats.total - totalCompleted
      })
    }

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

