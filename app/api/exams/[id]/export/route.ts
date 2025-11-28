import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xuất kết quả' }, { status: 403 })
    }

    // Lấy thông tin bài thi
    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      select: {
        title: true,
      },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Không tìm thấy bài thi' }, { status: 404 })
    }

    // Lấy tất cả kết quả bài thi
    const results = await prisma.examResult.findMany({
      where: { examId: params.id },
      orderBy: { completedAt: 'desc' },
    })

    // Chuẩn bị dữ liệu cho Excel
    const excelData = results.map((result, index) => {
      const mins = Math.floor(result.timeSpent / 60)
      const secs = result.timeSpent % 60
      const timeSpentFormatted = `${mins} phút ${secs} giây`
      
      return {
        'STT': index + 1,
        'Họ và tên': result.studentName || '-',
        'Mã nhân viên': result.studentId || '-',
        'Điểm': result.score.toFixed(1),
        'Số câu đúng': result.correctAnswers,
        'Số câu sai': result.totalQuestions - result.correctAnswers,
        'Tổng số câu': result.totalQuestions,
        'Thời gian làm bài': timeSpentFormatted,
        'Lần làm': result.attemptNumber,
        'Thời gian nộp': format(new Date(result.completedAt), 'dd/MM/yyyy HH:mm', { locale: vi }),
      }
    })

    // Tạo workbook và worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Đặt độ rộng cột
    const columnWidths = [
      { wch: 5 },   // STT
      { wch: 25 },  // Họ và tên
      { wch: 15 },  // Mã nhân viên
      { wch: 10 },  // Điểm
      { wch: 12 },  // Số câu đúng
      { wch: 12 },  // Số câu sai
      { wch: 12 },  // Tổng số câu
      { wch: 18 },  // Thời gian làm bài
      { wch: 10 },  // Lần làm
      { wch: 20 },  // Thời gian nộp
    ]
    worksheet['!cols'] = columnWidths

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kết quả')

    // Tạo buffer từ workbook
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Tạo tên file đơn giản: ketqua_ngày xuất
    const fileName = `ketqua_${format(new Date(), 'dd-MM-yyyy', { locale: vi })}.xlsx`

    // Trả về file Excel
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting results:', error)
    return NextResponse.json({ error: 'Lỗi khi xuất kết quả' }, { status: 500 })
  }
}

