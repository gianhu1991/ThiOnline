import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Endpoint để thêm cột requireAllQuestions vào bảng Exam nếu chưa có
export async function POST(request: NextRequest) {
  try {
    // Kiểm tra xem cột requireAllQuestions đã tồn tại chưa bằng cách thử query
    try {
      // Thử query một exam với requireAllQuestions
      await prisma.$queryRaw`SELECT "requireAllQuestions" FROM "Exam" LIMIT 1`
      return NextResponse.json({
        success: true,
        message: 'Cột requireAllQuestions đã tồn tại trong bảng Exam',
      })
    } catch (error: any) {
      // Nếu lỗi là do cột chưa tồn tại, thêm cột
      if (error.message?.includes('requireAllQuestions') || error.code === '42703') {
        console.log('Cột requireAllQuestions chưa tồn tại, đang thêm...')
        
        // Thêm cột requireAllQuestions với giá trị mặc định false
        await prisma.$executeRaw`
          ALTER TABLE "Exam" 
          ADD COLUMN IF NOT EXISTS "requireAllQuestions" BOOLEAN DEFAULT false;
        `
        
        // Cập nhật các exam hiện có: set requireAllQuestions = false nếu NULL
        await prisma.$executeRaw`
          UPDATE "Exam" 
          SET "requireAllQuestions" = false 
          WHERE "requireAllQuestions" IS NULL;
        `
        
        return NextResponse.json({
          success: true,
          message: 'Đã thêm cột requireAllQuestions vào bảng Exam thành công',
        })
      }
      
      throw error
    }
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Lỗi khi chạy migration',
    }, { status: 500 })
  }
}

