import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import pdfParse from 'pdf-parse'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('type') as string
    const category = formData.get('category') as string || null

    if (!file) {
      return NextResponse.json({ error: 'Không có file được tải lên' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let questions: any[] = []

    if (fileType === 'excel' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Xử lý file Excel
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(worksheet)

      questions = data.map((row: any, index: number) => {
        // Format Excel: Câu hỏi | Đáp án 1 | Đáp án 2 | ... | Đáp án đúng (A,B,C) | Loại (single/multiple)
        const questionText = row['Câu hỏi'] || row['Question'] || row['Cau hoi'] || ''
        const type = row['Loại'] || row['Type'] || row['Loai'] || 'single'
        
        const options: string[] = []
        const correctAnswers: string[] = []
        
        // Lấy các đáp án (A, B, C, D, ...)
        for (let i = 1; i <= 10; i++) {
          const option = row[`Đáp án ${i}`] || row[`Answer ${i}`] || row[`Dap an ${i}`] || ''
          if (option) {
            const label = String.fromCharCode(64 + i) // A, B, C, D...
            options.push(`${label}. ${option}`)
          }
        }

        // Lấy đáp án đúng
        const correct = row['Đáp án đúng'] || row['Correct Answer'] || row['Dap an dung'] || ''
        if (correct) {
          correctAnswers.push(...correct.toString().split(',').map((a: string) => a.trim().toUpperCase()))
        }

        // Lấy lĩnh vực từ file hoặc dùng category từ form
        const questionCategory = row['Lĩnh vực'] || row['Category'] || row['Linh vuc'] || category || null

        return {
          content: questionText,
          type: type.toLowerCase() === 'multiple' ? 'multiple' : 'single',
          options: JSON.stringify(options),
          correctAnswers: JSON.stringify(correctAnswers),
          category: questionCategory,
        }
      }).filter((q: any) => q.content && q.options && q.correctAnswers)
    } else if (fileType === 'pdf' || file.name.endsWith('.pdf')) {
      // Xử lý file PDF (đơn giản hóa - cần format chuẩn)
      const pdfData = await pdfParse(buffer)
      const text = pdfData.text
      
      // Parse PDF text (format: Câu hỏi\nA. ...\nB. ...\nĐáp án: A)
      const lines = text.split('\n').filter((line: string) => line.trim())
      
      let currentQuestion: any = null
      let currentOptions: string[] = []
      let currentCorrect: string[] = []

      for (const line of lines) {
        const trimmed = line.trim()
        
        // Phát hiện câu hỏi mới (không bắt đầu bằng chữ cái và dấu chấm)
        if (!trimmed.match(/^[A-Z]\.\s/) && !trimmed.match(/^Đáp án:/i)) {
          if (currentQuestion && currentOptions.length > 0) {
            questions.push({
              content: currentQuestion,
              type: currentCorrect.length > 1 ? 'multiple' : 'single',
              options: JSON.stringify(currentOptions),
              correctAnswers: JSON.stringify(currentCorrect),
              category: category || null,
            })
          }
          currentQuestion = trimmed
          currentOptions = []
          currentCorrect = []
        } else if (trimmed.match(/^[A-Z]\.\s/)) {
          // Đáp án
          currentOptions.push(trimmed)
        } else if (trimmed.match(/^Đáp án:/i)) {
          // Đáp án đúng
          const answers = trimmed.replace(/^Đáp án:\s*/i, '').split(',').map((a: string) => a.trim().toUpperCase())
          currentCorrect.push(...answers)
        }
      }

      // Thêm câu hỏi cuối cùng
      if (currentQuestion && currentOptions.length > 0) {
        questions.push({
          content: currentQuestion,
          type: currentCorrect.length > 1 ? 'multiple' : 'single',
          options: JSON.stringify(currentOptions),
          correctAnswers: JSON.stringify(currentCorrect),
          category: category || null,
        })
      }
    } else {
      return NextResponse.json({ error: 'Định dạng file không được hỗ trợ' }, { status: 400 })
    }

    // Lưu vào database
    const created = await prisma.question.createMany({
      data: questions,
      skipDuplicates: true,
    })

    return NextResponse.json({ 
      success: true, 
      message: `Đã import thành công ${created.count} câu hỏi`,
      count: created.count 
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json({ 
      error: 'Lỗi khi import file: ' + error.message 
    }, { status: 500 })
  }
}

