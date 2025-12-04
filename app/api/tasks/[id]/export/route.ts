import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { isSuperAdminByUsername } from '@/lib/super-admin'
import * as XLSX from 'xlsx'

// Xuất file Excel kết quả thực hiện nhiệm vụ (Super Admin)
export async function GET(
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
      return NextResponse.json({ error: 'Chỉ Super Admin mới được xuất file' }, { status: 403 })
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

    // Tạo dữ liệu Excel
    const excelData = task.customers.map(customer => ({
      'STT': customer.stt,
      'Account': customer.account,
      'Tên KH': customer.customerName,
      'Địa chỉ': customer.address || '',
      'Số điện thoại': customer.phone || '',
      'NV thực hiện': customer.assignedUsername || '',
      'Trạng thái': customer.isCompleted ? 'Đã hoàn thành' : 'Chưa hoàn thành',
      'Thời gian hoàn thành': customer.completedAt ? new Date(customer.completedAt).toLocaleString('vi-VN') : '',
      'Người hoàn thành': customer.completedBy || '',
    }))

    // Tạo workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kết quả')

    // Tạo buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Trả về file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="ket-qua-${task.name}-${Date.now()}.xlsx"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting file:', error)
    return NextResponse.json({ error: 'Lỗi khi xuất file' }, { status: 500 })
  }
}

