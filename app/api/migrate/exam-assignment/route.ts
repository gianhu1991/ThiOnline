import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// API endpoint để tạo bảng ExamAssignment nếu chưa có
export async function POST(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được chạy migration' }, { status: 403 })
    }

    // Kiểm tra xem bảng ExamAssignment đã tồn tại chưa bằng cách thử query
    try {
      await prisma.examAssignment.findFirst({ take: 1 })
      return NextResponse.json({ 
        success: true, 
        message: 'Bảng ExamAssignment đã tồn tại' 
      })
    } catch (error: any) {
      // Nếu bảng chưa tồn tại, Prisma sẽ báo lỗi
      if (error.message?.includes('does not exist') || error.code === 'P2021') {
        // Chạy migration SQL để tạo bảng
        // Lưu ý: Cần chạy SQL trực tiếp vì Prisma không hỗ trợ tạo bảng động
        return NextResponse.json({ 
          success: false, 
          message: 'Bảng ExamAssignment chưa tồn tại. Vui lòng chạy migration SQL trong Supabase SQL Editor.',
          sql: `
-- Tạo bảng ExamAssignment
CREATE TABLE IF NOT EXISTS "ExamAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    UNIQUE("examId", "userId")
);

CREATE INDEX IF NOT EXISTS "ExamAssignment_examId_idx" ON "ExamAssignment"("examId");
CREATE INDEX IF NOT EXISTS "ExamAssignment_userId_idx" ON "ExamAssignment"("userId");
          `
        })
      }
      throw error
    }
  } catch (error: any) {
    console.error('Error checking ExamAssignment table:', error)
    return NextResponse.json({ 
      error: 'Lỗi khi kiểm tra bảng ExamAssignment',
      details: error.message 
    }, { status: 500 })
  }
}

