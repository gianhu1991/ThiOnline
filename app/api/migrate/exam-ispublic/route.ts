import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Endpoint để thêm cột isPublic vào bảng Exam nếu chưa có
export async function POST(request: NextRequest) {
  try {
    // Kiểm tra xem cột isPublic đã tồn tại chưa bằng cách thử query
    try {
      // Thử query một exam với isPublic
      await prisma.$queryRaw`SELECT "isPublic" FROM "Exam" LIMIT 1`
      return NextResponse.json({
        success: true,
        message: 'Cột isPublic đã tồn tại trong bảng Exam',
      })
    } catch (error: any) {
      // Nếu lỗi là do cột chưa tồn tại, thêm cột
      if (error.message?.includes('isPublic') || error.code === '42703') {
        console.log('Cột isPublic chưa tồn tại, đang thêm...')
        
        // Thêm cột isPublic với giá trị mặc định false
        await prisma.$executeRaw`
          ALTER TABLE "Exam" 
          ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN DEFAULT false;
        `
        
        // Cập nhật các exam hiện có: set isPublic = false nếu NULL
        await prisma.$executeRaw`
          UPDATE "Exam" 
          SET "isPublic" = false 
          WHERE "isPublic" IS NULL;
        `
        
        return NextResponse.json({
          success: true,
          message: 'Đã thêm cột isPublic vào bảng Exam thành công',
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

