import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    // Tạo dữ liệu mẫu
    const sampleData = [
      {
        'Câu hỏi': '2 + 2 bằng bao nhiêu?',
        'Đáp án 1': '3',
        'Đáp án 2': '4',
        'Đáp án 3': '5',
        'Đáp án 4': '6',
        'Đáp án đúng': 'B',
        'Loại': 'single',
        'Lĩnh vực': 'Toán học'
      },
      {
        'Câu hỏi': 'Các số chẵn trong dãy sau là?',
        'Đáp án 1': '2',
        'Đáp án 2': '3',
        'Đáp án 3': '4',
        'Đáp án 4': '5',
        'Đáp án đúng': 'A,C',
        'Loại': 'multiple',
        'Lĩnh vực': 'Toán học'
      },
      {
        'Câu hỏi': 'Thủ đô của Việt Nam là?',
        'Đáp án 1': 'Hà Nội',
        'Đáp án 2': 'Hồ Chí Minh',
        'Đáp án 3': 'Đà Nẵng',
        'Đáp án 4': 'Huế',
        'Đáp án đúng': 'A',
        'Loại': 'single',
        'Lĩnh vực': 'Địa lý'
      }
    ]

    // Tạo workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    
    // Đặt độ rộng cột
    worksheet['!cols'] = [
      { wch: 40 }, // Câu hỏi
      { wch: 20 }, // Đáp án 1
      { wch: 20 }, // Đáp án 2
      { wch: 20 }, // Đáp án 3
      { wch: 20 }, // Đáp án 4
      { wch: 15 }, // Đáp án đúng
      { wch: 12 }, // Loại
      { wch: 15 }, // Lĩnh vực
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Câu hỏi')

    // Tạo buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Trả về file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="mau-cau-hoi.xlsx"',
      },
    })
  } catch (error: any) {
    console.error('Template generation error:', error)
    return NextResponse.json({ error: 'Lỗi khi tạo file mẫu' }, { status: 500 })
  }
}

