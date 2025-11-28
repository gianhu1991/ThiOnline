import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// Đảm bảo route này luôn dynamic, không cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Lấy danh sách bài thi được gán cho user hiện tại
export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    // Lấy danh sách bài thi được gán cho user này
    const assignments = await prisma.examAssignment.findMany({
      where: { userId: user.userId },
      include: {
        exam: {
          include: {
            _count: {
              select: { examResults: true }
            }
          }
        }
      },
      orderBy: { assignedAt: 'desc' },
    })

    // Lọc các bài thi:
    // 1. Phải đang active (isActive = true)
    // 2. Phải trong thời gian mở/đóng
    const now = new Date()
    const availableExams = assignments
      .map(a => a.exam)
      .filter(exam => {
        // Kiểm tra isActive
        if (!exam.isActive) return false
        
        // Kiểm tra thời gian
        const startDate = new Date(exam.startDate)
        const endDate = new Date(exam.endDate)
        
        return now >= startDate && now <= endDate
      })

    return NextResponse.json(availableExams, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('Error fetching my exams:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách bài thi' }, { status: 500 })
  }
}

