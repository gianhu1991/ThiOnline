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

    // Lấy danh sách khách hàng hiện có để kiểm tra trùng lặp và cập nhật
    const existingCustomers = await prisma.taskCustomer.findMany({
      where: { taskId: params.id },
      select: { 
        id: true,
        account: true,
        stt: true,
        customerName: true,
        address: true,
        phone: true,
        assignedUserId: true,
        assignedUsername: true
      }
    })
    
    // Tạo Map để tra cứu nhanh (account -> customer)
    const existingCustomersMap = new Map<string, typeof existingCustomers[0]>()
    existingCustomers.forEach(c => {
      existingCustomersMap.set(c.account.toLowerCase().trim(), c)
    })

    // Lấy tất cả users một lần để cache (tránh query nhiều lần)
    const allUsers = await prisma.user.findMany({
      select: { id: true, username: true }
    })
    const userMap = new Map<string, string>() // username (lowercase) -> userId
    allUsers.forEach(user => {
      userMap.set(user.username.toLowerCase(), user.id)
    })
    
    console.log(`[Upload] Đã load ${allUsers.length} users: ${allUsers.map(u => u.username).join(', ')}`)

    // Xử lý dữ liệu Excel
    // Cấu trúc: STT, account, Tên KH, địa chỉ, số điện thoại, NV thực hiện
    
    // Bước 1: Loại bỏ trùng lặp trong file Excel (nếu có nhiều dòng cùng account, chỉ lấy dòng cuối cùng)
    const excelDataMap = new Map<string, any>() // account -> row data
    for (const row of data as any[]) {
      const account = row['account'] || row['Account'] || row['ACCOUNT'] || ''
      const customerName = row['Tên KH'] || row['Tên khách hàng'] || row['Tên KH'] || row['customerName'] || ''
      
      if (!account || !customerName) {
        continue // Bỏ qua dòng không hợp lệ
      }
      
      const accountNormalized = account.toString().toLowerCase().trim()
      // Lưu dòng cuối cùng nếu có trùng lặp
      excelDataMap.set(accountNormalized, row)
    }
    
    console.log(`[Upload] Đã loại bỏ trùng lặp: ${data.length} dòng -> ${excelDataMap.size} KH duy nhất`)
    
    // Bước 2: Xử lý từng KH (đã loại bỏ trùng lặp)
    const customers = [] // KH mới cần tạo (chỉ những KH chưa tồn tại trong DB)
    let skippedCount = 0 // Đếm số KH bị bỏ qua (đã tồn tại trong DB)
    
    // Convert Map entries to array để tránh lỗi TypeScript
    const excelDataArray = Array.from(excelDataMap.entries())
    for (const [accountNormalized, row] of excelDataArray) {
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
      const existingCustomer = existingCustomersMap.get(accountNormalized)

      // Tìm user từ cache (không cần query database)
      // QUAN TRỌNG: Phải tìm chính xác username từ Excel, không được nhầm lẫn
      let assignedUserId: string | null = null
      let actualAssignedUsername: string | null = null
      if (assignedUsername) {
        const usernameFromExcel = assignedUsername.toString().trim()
        const usernameNormalized = usernameFromExcel.toLowerCase()
        
        console.log(`[Upload] Tìm user cho KH ${account}: Excel="${usernameFromExcel}" (normalized: "${usernameNormalized}")`)
        
        // Tìm user bằng cách so sánh case-insensitive
        assignedUserId = userMap.get(usernameNormalized) || null
        
        // Nếu tìm thấy user, lấy username thực tế từ database (không phải từ Excel)
        // Điều này đảm bảo assignedUsername luôn khớp với username trong database
        if (assignedUserId) {
          // Tìm username thực tế từ allUsers
          const actualUser = allUsers.find(u => u.id === assignedUserId)
          if (actualUser) {
            actualAssignedUsername = actualUser.username
            console.log(`[Upload] KH ${account}: Tìm thấy user "${actualUser.username}" (ID: ${assignedUserId})`)
            // Log để debug nếu username từ Excel khác với username trong database
            if (actualUser.username.toLowerCase() !== usernameNormalized) {
              console.warn(`[Upload] Username mismatch: Excel="${usernameFromExcel}" -> DB="${actualUser.username}"`)
            }
          } else {
            // Fallback: dùng giá trị từ Excel nếu không tìm thấy
            actualAssignedUsername = usernameFromExcel
            console.warn(`[Upload] User ID found but user not in allUsers: userId=${assignedUserId}, excelUsername="${usernameFromExcel}"`)
          }
        } else {
          // Nếu không tìm thấy user, vẫn lưu giá trị từ Excel để có thể tìm kiếm sau
          actualAssignedUsername = usernameFromExcel
          console.warn(`[Upload] User not found in database: excelUsername="${usernameFromExcel}"`)
          // Log tất cả users để debug
          console.log(`[Upload] Available users: ${Array.from(userMap.keys()).join(', ')}`)
        }
      }

      // Nếu KH đã tồn tại trong database, BỎ QUA (không cập nhật, không tạo mới)
      if (existingCustomer) {
        skippedCount++ // KH đã tồn tại, bỏ qua
        console.log(`[Upload] - Bỏ qua KH ${account}: đã tồn tại trong database (trùng account)`)
      } else {
        // KH mới, thêm vào danh sách tạo mới
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
      }
    }

    // Lưu vào database theo batch để tránh timeout (500 records mỗi batch)
    const BATCH_SIZE = 500
    let addedCount = 0
    
    console.log(`Bắt đầu lưu ${customers.length} khách hàng theo batch (${BATCH_SIZE} records/batch)...`)
    
    // Thống kê phân giao từ Excel
    const assignmentStats = new Map<string, number>() // username -> count
    customers.forEach(c => {
      if (c.assignedUsername) {
        const count = assignmentStats.get(c.assignedUsername) || 0
        assignmentStats.set(c.assignedUsername, count + 1)
      }
    })
    console.log('[Upload] Thống kê phân giao từ Excel:', Array.from(assignmentStats.entries()).map(([user, count]) => `${user}: ${count}`).join(', '))
    
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

    // KHÔNG tự động phân giao khi upload
    // Phân giao trong Excel là nguồn gốc và duy nhất
    // Nếu Excel có gán thì giữ nguyên, nếu không có gán thì để null
    // Admin phải sử dụng chức năng "Phân giao lại" để phân giao KH chưa được gán
    const autoAssignedCount = 0

    // Tạo thông báo chi tiết
    let message = `Đã thêm ${addedCount} khách hàng mới vào nhiệm vụ`
    const assignedCount = customers.filter(c => c.assignedUserId).length
    const unassignedCount = customers.filter(c => !c.assignedUserId).length
    if (assignedCount > 0) {
      message += `. Đã phân giao ${assignedCount} khách hàng mới theo file Excel`
    }
    if (unassignedCount > 0) {
      message += `. ${unassignedCount} khách hàng mới chưa được phân giao (cần dùng chức năng "Phân giao lại" để phân giao)`
    }
    if (skippedCount > 0) {
      message += `. Bỏ qua ${skippedCount} khách hàng đã tồn tại trong database (trùng account)`
    }
    
    return NextResponse.json({ 
      success: true, 
      message,
      added: addedCount,
      skipped: skippedCount,
      total: addedCount + skippedCount
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Lỗi khi upload file: ' + error.message }, { status: 500 })
  }
}

