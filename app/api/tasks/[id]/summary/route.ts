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
      console.log('[Summary] Date parameter received:', dateParam)
      
      // Lấy tất cả customers đã hoàn thành
      const allCompletedCustomers = await prisma.taskCustomer.findMany({
        where: {
          taskId: params.id,
          isCompleted: true,
          completedAt: { not: null }
        },
        select: {
          assignedUsername: true,
          completedAt: true
        }
      })
      
      console.log('[Summary] Total completed customers:', allCompletedCustomers.length)
      
      let matchCount = 0
      
      // Filter theo ngày: format completedAt về YYYY-MM-DD và so sánh
      allCompletedCustomers.forEach((customer, index) => {
        if (!customer.completedAt) return
        
        // Format completedAt về YYYY-MM-DD
        // Thử cả UTC và UTC+7
        const completedDate = new Date(customer.completedAt)
        
        // Format theo UTC
        const utcYear = completedDate.getUTCFullYear()
        const utcMonth = completedDate.getUTCMonth() + 1
        const utcDay = completedDate.getUTCDate()
        const utcDateStr = `${utcYear}-${String(utcMonth).padStart(2, '0')}-${String(utcDay).padStart(2, '0')}`
        
        // Format theo UTC+7 (VN timezone)
        const vnTime = new Date(completedDate.getTime() + 7 * 60 * 60 * 1000)
        const vnYear = vnTime.getUTCFullYear()
        const vnMonth = vnTime.getUTCMonth() + 1
        const vnDay = vnTime.getUTCDate()
        const vnDateStr = `${vnYear}-${String(vnMonth).padStart(2, '0')}-${String(vnDay).padStart(2, '0')}`
        
        // Log first 5 để debug
        if (index < 5) {
          console.log(`[Summary] Customer ${index + 1}: completedAt=${customer.completedAt}, UTC=${utcDateStr}, VN=${vnDateStr}, Selected=${dateParam}`)
        }
        
        // So sánh với date được chọn (thử cả UTC và VN)
        const isMatch = utcDateStr === dateParam || vnDateStr === dateParam
        
        if (isMatch) {
          const username = customer.assignedUsername || 'Chưa gán'
          if (summaryMap.has(username)) {
            summaryMap.get(username)!.completed++
            matchCount++
            if (matchCount <= 3) {
              console.log(`[Summary] Match ${matchCount}: ${username}, date: ${utcDateStr}/${vnDateStr}`)
            }
          }
        }
      })
      
      console.log(`[Summary] Total matches found: ${matchCount}`)
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

