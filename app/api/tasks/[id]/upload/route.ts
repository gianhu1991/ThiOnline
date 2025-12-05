import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import * as XLSX from 'xlsx'

// Tăng timeout cho route này (5 phút) - chỉ hoạt động trên Vercel Pro
export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Upload file Excel cho nhiệm vụ (Admin)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được upload file' }, { status: 403 })
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

    // Lấy danh sách khách hàng hiện có để kiểm tra trùng lặp
    const existingCustomers = await prisma.taskCustomer.findMany({
      where: { taskId: params.id },
      select: { account: true }
    })
    
    // Tạo Set để kiểm tra nhanh trùng lặp (theo account)
    const existingAccounts = new Set(existingCustomers.map(c => c.account.toLowerCase().trim()))

    // Lấy tất cả users một lần để cache (tránh query nhiều lần)
    const allUsers = await prisma.user.findMany({
      select: { id: true, username: true }
    })
    const userMap = new Map<string, string>() // username -> userId
    allUsers.forEach(user => {
      userMap.set(user.username.toLowerCase(), user.id)
    })

    // Xử lý dữ liệu Excel
    // Cấu trúc: STT, account, Tên KH, địa chỉ, số điện thoại, NV thực hiện
    const customers = []
    let skippedCount = 0 // Đếm số KH bị bỏ qua do trùng lặp
    
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

      const accountNormalized = account.toString().toLowerCase().trim()
      
      // Kiểm tra trùng lặp theo account
      if (existingAccounts.has(accountNormalized)) {
        skippedCount++
        continue // Bỏ qua KH đã tồn tại
      }

      // Tìm user từ cache (không cần query database)
      let assignedUserId: string | null = null
      let actualAssignedUsername: string | null = null
      if (assignedUsername) {
        const usernameNormalized = assignedUsername.toString().toLowerCase().trim()
        assignedUserId = userMap.get(usernameNormalized) || null
        
        // Nếu tìm thấy user, lấy username thực tế từ database (không phải từ Excel)
        // Điều này đảm bảo assignedUsername luôn khớp với username trong database
        if (assignedUserId) {
          // Tìm username thực tế từ allUsers
          const actualUser = allUsers.find(u => u.id === assignedUserId)
          if (actualUser) {
            actualAssignedUsername = actualUser.username
          } else {
            // Fallback: dùng giá trị từ Excel nếu không tìm thấy
            actualAssignedUsername = assignedUsername.toString().trim()
          }
        } else {
          // Nếu không tìm thấy user, vẫn lưu giá trị từ Excel để có thể tìm kiếm sau
          actualAssignedUsername = assignedUsername.toString().trim()
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
        assignedUsername: actualAssignedUsername, // Lưu username thực tế từ database (nếu tìm thấy) hoặc từ Excel
        assignedAt: assignedUserId ? new Date() : null, // Lưu thời gian phân giao nếu có
        isCompleted: false,
      })
      
      // Thêm vào Set để tránh trùng trong cùng một lần upload
      existingAccounts.add(accountNormalized)
    }

    // Lưu danh sách account của KH mới để query lại sau (chỉ các KH không có assignedUserId)
    const newUnassignedAccounts = customers
      .filter(c => !c.assignedUserId)
      .map(c => c.account.toLowerCase().trim())

    // Lưu vào database theo batch để tránh timeout (500 records mỗi batch)
    const BATCH_SIZE = 500
    let addedCount = 0
    
    console.log(`Bắt đầu lưu ${customers.length} khách hàng theo batch (${BATCH_SIZE} records/batch)...`)
    
    for (let i = 0; i < customers.length; i += BATCH_SIZE) {
      const batch = customers.slice(i, i + BATCH_SIZE)
      if (batch.length > 0) {
        try {
          await prisma.taskCustomer.createMany({
            data: batch,
            skipDuplicates: true // Bỏ qua nếu có duplicate (an toàn hơn)
          })
          addedCount += batch.length
          console.log(`Đã lưu batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(customers.length / BATCH_SIZE)}: ${batch.length} records`)
        } catch (error: any) {
          console.error(`Lỗi khi lưu batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error)
          // Tiếp tục với batch tiếp theo thay vì dừng toàn bộ
        }
      }
    }
    
    console.log(`Hoàn thành: Đã thêm ${addedCount}/${customers.length} khách hàng`)

    // Tự động phân giao các KH mới không có assignedUserId cho các user đã được gán nhiệm vụ
    let autoAssignedCount = 0
    if (newUnassignedAccounts.length > 0) {
      // Lấy danh sách user đã được gán nhiệm vụ
      const taskAssignments = await prisma.taskAssignment.findMany({
        where: { taskId: params.id },
        include: {
          user: {
            select: { id: true, username: true }
          }
        }
      })

      if (taskAssignments.length > 0) {
        // Lấy tất cả KH không có assignedUserId và filter theo danh sách account mới
        const allUnassignedCustomers = await prisma.taskCustomer.findMany({
          where: {
            taskId: params.id,
            assignedUserId: null,
            isCompleted: false
          },
          orderBy: { stt: 'asc' }
        })
        
        // Filter chỉ lấy các KH mới vừa upload (so sánh account case-insensitive)
        const unassignedCustomers = allUnassignedCustomers.filter(c => 
          newUnassignedAccounts.includes(c.account.toLowerCase().trim())
        )

        if (unassignedCustomers.length > 0) {
          const assignedUsers = taskAssignments.map(a => a.user)
          
          // Phân giao đều cho các user (round-robin)
          for (let i = 0; i < unassignedCustomers.length; i++) {
            const customer = unassignedCustomers[i]
            const assignedUser = assignedUsers[i % assignedUsers.length]
            
            await prisma.taskCustomer.update({
              where: { id: customer.id },
              data: {
                assignedUserId: assignedUser.id,
                assignedUsername: assignedUser.username,
                assignedAt: null // Chưa phân giao theo ngày, sẽ được phân giao khi chạy "Phân giao lại"
              }
            })
            autoAssignedCount++
          }
        }
      }
    }

    // Tạo thông báo chi tiết
    let message = `Đã thêm ${addedCount} khách hàng mới vào nhiệm vụ`
    if (autoAssignedCount > 0) {
      message += `. Đã tự động phân giao ${autoAssignedCount} khách hàng cho các nhân viên đã được gán nhiệm vụ`
    }
    if (skippedCount > 0) {
      message += `. Bỏ qua ${skippedCount} khách hàng đã tồn tại (trùng account)`
    }
    
    return NextResponse.json({ 
      success: true, 
      message,
      added: addedCount,
      autoAssigned: autoAssignedCount,
      skipped: skippedCount,
      total: addedCount + skippedCount
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Lỗi khi upload file: ' + error.message }, { status: 500 })
  }
}

