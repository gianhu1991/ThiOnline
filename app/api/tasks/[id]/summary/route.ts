import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'

// Lấy dữ liệu tổng hợp kết quả thực hiện nhiệm vụ
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    // Admin luôn được phép
    if (user.role !== 'admin') {
      // Kiểm tra quyền EXPORT_TASK_RESULTS (xem kết quả cũng cần quyền này)
      const canView = await hasUserPermission(user.userId, user.role, PERMISSIONS.EXPORT_TASK_RESULTS, user.username)
      if (!canView) {
        return NextResponse.json({ error: 'Bạn không có quyền xem kết quả' }, { status: 403 })
      }
    }

    // Lấy query parameter date (format: YYYY-MM-DD)
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    // Lấy TẤT CẢ customers của task
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
      // Reset completed count về 0 cho tất cả users trước khi tính lại
      summaryMap.forEach((stats) => {
        stats.completed = 0
      })
      
      // Parse date từ YYYY-MM-DD
      const [year, month, day] = dateParam.split('-').map(Number)
      
      // Tạo date range: từ 00:00:00 đến 23:59:59 của ngày được chọn
      // User chọn ngày theo timezone của họ (UTC+7 cho VN)
      // Ngày 5/12 00:00:00 VN = 4/12 17:00:00 UTC
      // Ngày 5/12 23:59:59 VN = 5/12 16:59:59 UTC
      // Nhưng để đảm bảo, ta mở rộng range một chút
      const startDate = new Date(Date.UTC(year, month - 1, day - 1, 16, 0, 0, 0)) // 16:00 UTC ngày trước
      const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)) // 23:59 UTC ngày được chọn
      
      // Query customers hoàn thành trong date range này
      const completedInDate = await prisma.taskCustomer.groupBy({
        by: ['assignedUsername'],
        where: {
          taskId: params.id,
          isCompleted: true,
          completedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          id: true
        }
      })
      
      // Cập nhật completed count cho từng user
      completedInDate.forEach(item => {
        const username = item.assignedUsername || 'Chưa gán'
        if (summaryMap.has(username)) {
          summaryMap.get(username)!.completed = item._count.id
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

    // Thêm debug info vào response để xem trong browser
    const debugInfo = dateParam ? {
      dateParam,
      totalCompleted: allCustomers.filter(c => c.isCompleted).length,
      filteredCompleted: summaryData.reduce((sum, item) => sum + item['Đã thực hiện'], 0)
    } : null

    return NextResponse.json({
      taskName: task.name,
      summary: summaryData,
      ...(debugInfo && { debug: debugInfo })
    })
  } catch (error: any) {
    console.error('Error fetching summary:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy dữ liệu tổng hợp' }, { status: 500 })
  }
}

