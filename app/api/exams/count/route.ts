import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

/**
 * API để lấy số lượng bài thi - không cần quyền view_exams
 * Chỉ cần đăng nhập là được (để hiển thị trên trang chủ)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    // Lấy tổng số bài thi (không cần check permission chi tiết)
    const count = await prisma.exam.count()
    
    return NextResponse.json({ count })
  } catch (error: any) {
    console.error('[GET /api/exams/count] Error:', error)
    
    // Nếu bảng chưa tồn tại, trả về 0
    if (error.message?.includes('does not exist') || error.code === 'P2021') {
      return NextResponse.json({ count: 0 })
    }
    
    return NextResponse.json({ error: 'Lỗi khi lấy số lượng bài thi' }, { status: 500 })
  }
}

