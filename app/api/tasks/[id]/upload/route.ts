import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'
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
    console.log('[Upload] Bắt đầu upload file Excel cho task:', params.id)
    
    const user = await getJWT(request)
    
    if (!user) {
      console.log('[Upload] Lỗi: Chưa đăng nhập')
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    const canUpload = await hasUserPermission(user.userId, user.role, PERMISSIONS.UPLOAD_TASK_DATA)
    if (!canUpload) {
      console.log('[Upload] Lỗi: Không có quyền upload')
      return NextResponse.json({ error: 'Bạn không có quyền upload dữ liệu' }, { status: 403 })
    }

    console.log('[Upload] User:', user.username)

    // Kiểm tra nhiệm vụ tồn tại
    const task = await prisma.task.findUnique({
      where: { id: params.id }
    })

    if (!task) {
      console.log('[Upload] Lỗi: Không tìm thấy nhiệm vụ')
      return NextResponse.json({ error: 'Không tìm thấy nhiệm vụ' }, { status: 404 })
    }

    console.log('[Upload] Task found:', task.name)

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.log('[Upload] Lỗi: Không có file')
      return NextResponse.json({ error: 'Không có file được tải lên' }, { status: 400 })
    }

    console.log('[Upload] File name:', file.name, 'Size:', file.size)

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      console.log('[Upload] Lỗi: File không phải Excel')
      return NextResponse.json({ error: 'File phải là Excel (.xlsx hoặc .xls)' }, { status: 400 })
    }

    console.log('[Upload] Đang đọc file Excel...')
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    console.log('[Upload] Đã đọc file, số dòng:', data.length)

    if (data.length === 0) {
      console.log('[Upload] Lỗi: File không có dữ liệu')
      return NextResponse.json({ error: 'File Excel không có dữ liệu' }, { status: 400 })
    }

    // Lấy danh sách khách hàng hiện có để kiểm tra trùng lặp và cập nhật
    console.log('[Upload] Đang lấy danh sách KH hiện có...')
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
    
    console.log('[Upload] Số KH hiện có trong DB:', existingCustomers.length)
    
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
    console.log('[Upload] Bước 1: Loại bỏ trùng lặp trong file Excel...')
    const excelDataMap = new Map<string, any>() // account -> row data
    let invalidRows = 0
    for (const row of data as any[]) {
      const account = row['account'] || row['Account'] || row['ACCOUNT'] || ''
      const customerName = row['Tên KH'] || row['Tên khách hàng'] || row['Tên KH'] || row['customerName'] || ''
      
      if (!account || !customerName) {
        invalidRows++
        continue // Bỏ qua dòng không hợp lệ
      }
      
      const accountNormalized = account.toString().toLowerCase().trim()
      // Lưu dòng cuối cùng nếu có trùng lặp
      excelDataMap.set(accountNormalized, row)
    }
    
    console.log(`[Upload] Đã loại bỏ trùng lặp: ${data.length} dòng -> ${excelDataMap.size} KH duy nhất (${invalidRows} dòng không hợp lệ)`)
    
    // Bước 2: Xử lý từng KH (đã loại bỏ trùng lặp)
    console.log('[Upload] Bước 2: Xử lý từng KH...')
    const customers = [] // KH mới cần tạo (chỉ những KH chưa tồn tại trong DB)
    const customersToUpdate = [] // KH cần cập nhật (đã tồn tại trong DB)
    
    // Convert Map entries to array để tránh lỗi TypeScript
    const excelDataArray = Array.from(excelDataMap.entries())
    console.log(`[Upload] Số KH cần xử lý: ${excelDataArray.length}`)
    
    for (let idx = 0; idx < excelDataArray.length; idx++) {
      const [accountNormalized, row] = excelDataArray[idx]
      
      // Chỉ log mỗi 500 records để giảm overhead
      if (idx === 0 || (idx + 1) % 500 === 0 || idx === excelDataArray.length - 1) {
        console.log(`[Upload] Đang xử lý KH ${idx + 1}/${excelDataArray.length}...`)
      }
      
      const stt = row['STT'] || row['stt'] || row['Số thứ tự'] || null
      const account = row['account'] || row['Account'] || row['ACCOUNT'] || ''
      const customerName = row['Tên KH'] || row['Tên khách hàng'] || row['Tên KH'] || row['customerName'] || ''
      const address = row['địa chỉ'] || row['Địa chỉ'] || row['address'] || row['Address'] || null
      const phone = row['số điện thoại'] || row['Số điện thoại'] || row['phone'] || row['Phone'] || null
      const assignedUsername = row['NV thực hiện'] || row['NV thực hiện'] || row['assignedUser'] || row['AssignedUser'] || null

      if (!account || !customerName) {
        continue // Bỏ qua dòng không hợp lệ
      }

      // accountNormalized đã được lấy từ excelDataArray ở dòng 136, không cần định nghĩa lại
      const existingCustomer = existingCustomersMap.get(accountNormalized)

      // Tìm user từ cache (không cần query database)
      // QUAN TRỌNG: Phải tìm chính xác username từ Excel, không được nhầm lẫn
      let assignedUserId: string | null = null
      let actualAssignedUsername: string | null = null
      if (assignedUsername) {
        const usernameFromExcel = assignedUsername.toString().trim()
        const usernameNormalized = usernameFromExcel.toLowerCase()
        
        // Tìm user bằng cách so sánh case-insensitive
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
            actualAssignedUsername = usernameFromExcel
          }
        } else {
          // Nếu không tìm thấy user, vẫn lưu giá trị từ Excel để có thể tìm kiếm sau
          actualAssignedUsername = usernameFromExcel
        }
      }

      // Nếu KH đã tồn tại trong database, LUÔN cập nhật thông tin từ Excel
      if (existingCustomer) {
        // Luôn cập nhật thông tin từ Excel, không kiểm tra thay đổi
        const sttValue = stt ? parseInt(stt.toString()) : existingCustomer.stt
        const addressValue = address ? address.toString() : null
        const phoneValue = phone ? phone.toString() : null
        
        // Xác định assignedAt:
        // - Nếu có assignedUserId mới (gán mới hoặc thay đổi), set assignedAt = new Date()
        // - Nếu bỏ gán (từ có user -> null), set assignedAt = null
        // - Nếu không thay đổi assignedUserId, không cập nhật assignedAt (giữ nguyên)
        const updateData: any = {
          stt: sttValue,
          customerName: customerName.toString(),
          address: addressValue,
          phone: phoneValue,
          assignedUserId,
          assignedUsername: actualAssignedUsername,
        }
        
        // Chỉ cập nhật assignedAt nếu có thay đổi về assignedUserId
        if (assignedUserId !== existingCustomer.assignedUserId) {
          if (assignedUserId) {
            // Gán mới hoặc thay đổi user -> cập nhật thời gian
            updateData.assignedAt = new Date()
          } else {
            // Bỏ gán -> reset thời gian
            updateData.assignedAt = null
          }
        }
        
        customersToUpdate.push({
          id: existingCustomer.id,
          ...updateData
        })
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

    // Cập nhật các KH đã tồn tại - dùng batch updates để tăng tốc
    console.log(`[Upload] Bước 3: Cập nhật ${customersToUpdate.length} KH đã tồn tại...`)
    let updatedCount = 0
    
    // Dùng batch updates với concurrency limit để tránh quá tải database
    const UPDATE_BATCH_SIZE = 50 // Cập nhật 50 records mỗi batch
    const CONCURRENT_BATCHES = 5 // Chạy 5 batches song song
    
    for (let i = 0; i < customersToUpdate.length; i += UPDATE_BATCH_SIZE * CONCURRENT_BATCHES) {
      const batchGroup = customersToUpdate.slice(i, i + UPDATE_BATCH_SIZE * CONCURRENT_BATCHES)
      
      // Chia thành các batch nhỏ hơn và chạy song song
      const batches: Promise<void>[] = []
      for (let j = 0; j < batchGroup.length; j += UPDATE_BATCH_SIZE) {
        const batch = batchGroup.slice(j, j + UPDATE_BATCH_SIZE)
        
        const batchPromise = Promise.all(
          batch.map(async (customerUpdate) => {
            try {
              const { id, ...rest } = customerUpdate
              // Loại bỏ undefined values để tránh lỗi Prisma
              const updateData: any = {}
              if (rest.stt !== undefined) updateData.stt = rest.stt
              if (rest.customerName !== undefined) updateData.customerName = rest.customerName
              if (rest.address !== undefined) updateData.address = rest.address
              if (rest.phone !== undefined) updateData.phone = rest.phone
              if (rest.assignedUserId !== undefined) updateData.assignedUserId = rest.assignedUserId
              if (rest.assignedUsername !== undefined) updateData.assignedUsername = rest.assignedUsername
              if (rest.assignedAt !== undefined) updateData.assignedAt = rest.assignedAt
              
              await prisma.taskCustomer.update({
                where: { id },
                data: updateData
              })
              updatedCount++
            } catch (error: any) {
              console.error(`[Upload] Lỗi khi cập nhật KH ${customerUpdate.id}:`, error.message)
            }
          })
        ).then(() => {}) // Convert to Promise<void>
        
        batches.push(batchPromise)
      }
      
      // Chờ tất cả batches trong group hoàn thành
      await Promise.all(batches)
      
      if ((i + UPDATE_BATCH_SIZE * CONCURRENT_BATCHES) % 500 === 0 || i + UPDATE_BATCH_SIZE * CONCURRENT_BATCHES >= customersToUpdate.length) {
        console.log(`[Upload] Đã cập nhật ${updatedCount}/${customersToUpdate.length} khách hàng...`)
      }
    }
    console.log(`[Upload] Đã cập nhật ${updatedCount}/${customersToUpdate.length} khách hàng`)

    // Lưu vào database theo batch để tránh timeout (500 records mỗi batch)
    console.log(`[Upload] Bước 4: Lưu ${customers.length} KH mới...`)
    const BATCH_SIZE = 500
    let addedCount = 0
    
    console.log(`[Upload] Bắt đầu lưu ${customers.length} khách hàng mới theo batch (${BATCH_SIZE} records/batch)...`)
    
    // Thống kê phân giao từ Excel
    const assignmentStats = new Map<string, number>() // username -> count
    customers.forEach(c => {
      if (c.assignedUsername) {
        const count = assignmentStats.get(c.assignedUsername) || 0
        assignmentStats.set(c.assignedUsername, count + 1)
      }
    })
    customersToUpdate.forEach(c => {
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
    
    console.log(`Hoàn thành: Đã thêm ${addedCount}/${customers.length} khách hàng mới, cập nhật ${updatedCount}/${customersToUpdate.length} khách hàng`)

    // KHÔNG tự động phân giao khi upload
    // Phân giao trong Excel là nguồn gốc và duy nhất
    // Nếu Excel có gán thì giữ nguyên, nếu không có gán thì để null
    // Admin phải sử dụng chức năng "Phân giao lại" để phân giao KH chưa được gán
    const autoAssignedCount = 0

    // Tạo thông báo chi tiết
    console.log('[Upload] Tổng kết:')
    console.log(`[Upload] - KH mới: ${addedCount}/${customers.length}`)
    console.log(`[Upload] - KH cập nhật: ${updatedCount}/${customersToUpdate.length}`)
    
    let message = ''
    if (addedCount > 0) {
      message += `Đã thêm ${addedCount} khách hàng mới vào nhiệm vụ`
    }
    if (updatedCount > 0) {
      if (message) message += '. '
      message += `Đã cập nhật ${updatedCount} khách hàng (thay đổi NV thực hiện hoặc thông tin khác)`
    }
    if (addedCount === 0 && updatedCount === 0) {
      message = 'Không có thay đổi nào'
    }
    
    const assignedCount = customers.filter(c => c.assignedUserId).length + customersToUpdate.filter(c => c.assignedUserId).length
    const unassignedCount = customers.filter(c => !c.assignedUserId).length + customersToUpdate.filter(c => !c.assignedUserId).length
    if (assignedCount > 0) {
      message += `. Đã phân giao ${assignedCount} khách hàng theo file Excel`
    }
    if (unassignedCount > 0) {
      message += `. ${unassignedCount} khách hàng chưa được phân giao (cần dùng chức năng "Phân giao lại" để phân giao)`
    }
    
    console.log('[Upload] Hoàn thành upload thành công')
    
    return NextResponse.json({ 
      success: true, 
      message,
      added: addedCount,
      updated: updatedCount,
      total: addedCount + updatedCount
    })
  } catch (error: any) {
    console.error('[Upload] Lỗi khi upload file:', error.message)
    console.error('[Upload] Error stack:', error.stack)
    console.error('[Upload] Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Lỗi khi upload file: ' + error.message }, { status: 500 })
  }
}

