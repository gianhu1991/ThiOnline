import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import * as XLSX from 'xlsx'

// Xuất file Excel kết quả thực hiện nhiệm vụ (Admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xuất file' }, { status: 403 })
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
    const summaryDataSorted = Array.from(summaryMap.entries())
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
    
    const summaryData = summaryDataSorted

    // Tạo dữ liệu chi tiết
    const detailData = task.customers.map(customer => ({
      'STT': customer.stt,
      'Account': customer.account,
      'Tên KH': customer.customerName,
      'Địa chỉ': customer.address || '',
      'Số điện thoại': customer.phone || '',
      'NV thực hiện': getDisplayName(customer.assignedUsername),
      'Trạng thái': customer.isCompleted ? 'Đã thực hiện' : 'Chưa thực hiện',
    }))

    // Tạo workbook
    const workbook = XLSX.utils.book_new()
    
    // Sheet 1: Tổng hợp
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
    summaryWorksheet['!cols'] = [
      { wch: 5 },  // STT
      { wch: 30 }, // Tên NV
      { wch: 18 }, // Số lượng KH phân giao
      { wch: 15 }, // Đã thực hiện
      { wch: 15 }, // Chưa thực hiện
    ]
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Tổng hợp')
    
    // Sheet 2: Chi tiết
    const detailWorksheet = XLSX.utils.json_to_sheet(detailData)
    detailWorksheet['!cols'] = [
      { wch: 5 },  // STT
      { wch: 20 }, // Account
      { wch: 30 }, // Tên KH
      { wch: 40 }, // Địa chỉ
      { wch: 15 }, // Số điện thoại
      { wch: 30 }, // NV thực hiện
      { wch: 15 }, // Trạng thái
    ]
    XLSX.utils.book_append_sheet(workbook, detailWorksheet, 'Chi tiết')

    // Tạo buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Tạo tên file an toàn (loại bỏ ký tự đặc biệt)
    const safeTaskName = task.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').substring(0, 50)
    const fileName = `ket-qua-${safeTaskName}-${Date.now()}.xlsx`

    // Trả về file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting file:', error)
    return NextResponse.json({ error: 'Lỗi khi xuất file' }, { status: 500 })
  }
}

