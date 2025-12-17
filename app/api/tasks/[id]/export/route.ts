import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// Xuất file Excel kết quả thực hiện nhiệm vụ (Admin và Leader)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    // Cho phép admin và leader xuất file
    if (!user || (user.role !== 'admin' && user.role !== 'leader')) {
      return NextResponse.json({ error: 'Chỉ admin và leader mới được xuất file' }, { status: 403 })
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
      'Thời gian TH': customer.completedAt 
        ? format(new Date(customer.completedAt), 'dd/MM/yyyy HH:mm', { locale: vi })
        : '',
    }))

    // Tạo workbook với ExcelJS
    const workbook = new ExcelJS.Workbook()
    
    // Định nghĩa style chung
    const defaultFont = { name: 'Times New Roman', size: 12 }
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { ...defaultFont, bold: true },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
    }
    const cellStyle: Partial<ExcelJS.Style> = {
      font: defaultFont,
      alignment: { vertical: 'middle' as const }
    }
    
    // Sheet 1: Tổng hợp
    const summarySheet = workbook.addWorksheet('Tổng hợp')
    
    // Đặt độ rộng cột
    summarySheet.columns = [
      { width: 5 },   // STT
      { width: 30 },  // Tên NV
      { width: 18 },  // Số lượng KH phân giao
      { width: 15 },  // Đã thực hiện
      { width: 15 },  // Chưa thực hiện
    ]
    
    // Thêm header row
    const summaryHeaderRow = summarySheet.addRow(Object.keys(summaryData[0] || {}))
    summaryHeaderRow.eachCell((cell) => {
      cell.style = headerStyle
    })
    
    // Thêm dữ liệu
    summaryData.forEach(row => {
      const dataRow = summarySheet.addRow(Object.values(row))
      dataRow.eachCell((cell) => {
        cell.style = cellStyle
      })
    })
    
    // Sheet 2: Chi tiết
    const detailSheet = workbook.addWorksheet('Chi tiết')
    
    // Đặt độ rộng cột
    detailSheet.columns = [
      { width: 5 },   // STT
      { width: 20 },  // Account
      { width: 30 },  // Tên KH
      { width: 40 },  // Địa chỉ
      { width: 15 },  // Số điện thoại
      { width: 30 },  // NV thực hiện
      { width: 15 },  // Trạng thái
      { width: 20 },  // Thời gian TH
    ]
    
    // Thêm header row
    const detailHeaderRow = detailSheet.addRow(Object.keys(detailData[0] || {}))
    detailHeaderRow.eachCell((cell) => {
      cell.style = headerStyle
    })
    
    // Thêm dữ liệu
    detailData.forEach(row => {
      const dataRow = detailSheet.addRow(Object.values(row))
      dataRow.eachCell((cell) => {
        cell.style = cellStyle
      })
    })

    // Tạo buffer
    const buffer = await workbook.xlsx.writeBuffer()

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

