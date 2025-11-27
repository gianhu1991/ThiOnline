import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Kiểm tra kết nối database
    const dbStatus = {
      connected: false,
      examCount: 0,
      exams: [] as any[],
      error: null as string | null,
    }

    try {
      // Đếm số bài thi
      dbStatus.examCount = await prisma.exam.count()
      dbStatus.connected = true

      // Lấy tất cả bài thi
      dbStatus.exams = await prisma.exam.findMany({
        select: {
          id: true,
          title: true,
          createdAt: true,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error: any) {
      dbStatus.error = error.message
      dbStatus.connected = false
    }

    return NextResponse.json({
      success: true,
      database: dbStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

