import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// Tải file mẫu Excel cho nhiệm vụ
export async function GET(request: NextRequest) {
  try {
    // Tạo dữ liệu mẫu
    const sampleData = [
      {
        'STT': 1,
        'account': 'ACC001',
        'Tên KH': 'Nguyễn Văn A',
        'địa chỉ': '123 Đường ABC, Quận 1, TP.HCM',
        'số điện thoại': '0901234567',
        'NV thực hiện': 'user1'
      },
      {
        'STT': 2,
        'account': 'ACC002',
        'Tên KH': 'Trần Thị B',
        'địa chỉ': '456 Đường XYZ, Quận 2, TP.HCM',
        'số điện thoại': '0907654321',
        'NV thực hiện': 'user2'
      },
      {
        'STT': 3,
        'account': 'ACC003',
        'Tên KH': 'Lê Văn C',
        'địa chỉ': '789 Đường DEF, Quận 3, TP.HCM',
        'số điện thoại': '0912345678',
        'NV thực hiện': 'user1'
      }
    ]

    // Tạo workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    
    // Đặt độ rộng cột
    worksheet['!cols'] = [
      { wch: 5 },  // STT
      { wch: 15 }, // account
      { wch: 25 }, // Tên KH
      { wch: 40 }, // địa chỉ
      { wch: 15 }, // số điện thoại
      { wch: 15 }, // NV thực hiện
    ]
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách khách hàng')

    // Tạo buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Trả về file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="mau-upload-nhiem-vu.xlsx"',
      },
    })
  } catch (error: any) {
    console.error('Error generating template:', error)
    return NextResponse.json({ error: 'Lỗi khi tạo file mẫu' }, { status: 500 })
  }
}

