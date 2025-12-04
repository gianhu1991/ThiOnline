import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import * as XLSX from 'xlsx'

// Upload file Excel cho nhiệm vụ (Super Admin)
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
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })

    if (firstUser?.id !== user.userId) {
      return NextResponse.json({ error: 'Chỉ Super Admin mới được upload file' }, { status: 403 })
    }

    // Kiểm tra nhiệm vụ tồn tại
    const task = await prisma.task.findUnique({
      where: { id: params.id }
    })

    if (!task) {
      return NextResponse.json({ error: 'Không tìm thấy nhiệm vụ' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Không có file được tải lên' }, { status: 400 })
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ error: 'File phải là Excel (.xlsx hoặc .xls)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    if (data.length === 0) {
      return NextResponse.json({ error: 'File Excel không có dữ liệu' }, { status: 400 })
    }

    // Xóa dữ liệu cũ (nếu có)
    await prisma.taskCustomer.deleteMany({
      where: { taskId: params.id }
    })

    // Xử lý dữ liệu Excel
    // Cấu trúc: STT, account, Tên KH, địa chỉ, số điện thoại, NV thực hiện
    const customers = []
    
    for (const row of data as any[]) {
      const stt = row['STT'] || row['stt'] || row['Số thứ tự'] || null
      const account = row['account'] || row['Account'] || row['ACCOUNT'] || ''
      const customerName = row['Tên KH'] || row['Tên khách hàng'] || row['Tên KH'] || row['customerName'] || ''
      const address = row['địa chỉ'] || row['Địa chỉ'] || row['address'] || row['Address'] || null
      const phone = row['số điện thoại'] || row['Số điện thoại'] || row['phone'] || row['Phone'] || null
      const assignedUsername = row['NV thực hiện'] || row['NV thực hiện'] || row['assignedUser'] || row['AssignedUser'] || null

      if (!account || !customerName) {
        continue // Bỏ qua dòng không hợp lệ
      }

      // Tìm user theo username nếu có
      let assignedUserId = null
      if (assignedUsername) {
        const assignedUser = await prisma.user.findUnique({
          where: { username: assignedUsername },
          select: { id: true }
        })
        if (assignedUser) {
          assignedUserId = assignedUser.id
        }
      }

      customers.push({
        taskId: params.id,
        stt: stt ? parseInt(stt.toString()) : 0,
        account: account.toString(),
        customerName: customerName.toString(),
        address: address ? address.toString() : null,
        phone: phone ? phone.toString() : null,
        assignedUserId,
        assignedUsername: assignedUsername ? assignedUsername.toString() : null,
        isCompleted: false,
      })
    }

    // Lưu vào database
    await prisma.taskCustomer.createMany({
      data: customers
    })

    return NextResponse.json({ 
      success: true, 
      message: `Đã import ${customers.length} khách hàng thành công`,
      count: customers.length
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Lỗi khi upload file: ' + error.message }, { status: 500 })
  }
}

