import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    // Admin luôn được phép
    if (user.role !== 'admin') {
      const canToggle = await hasUserPermission(user.userId, user.role, PERMISSIONS.TOGGLE_EXAM_STATUS, user.username)
      if (!canToggle) {
        return NextResponse.json({ error: 'Bạn không có quyền thay đổi trạng thái bài thi' }, { status: 403 })
      }
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Không tìm thấy bài thi' }, { status: 404 })
    }

    // Toggle trạng thái isPublic
    const updatedExam = await prisma.exam.update({
      where: { id: params.id },
      data: {
        isPublic: !exam.isPublic,
      },
    })

    return NextResponse.json({ 
      success: true, 
      exam: updatedExam,
      message: updatedExam.isPublic ? 'Bài thi đã được đặt công khai (có thể chia sẻ link)' : 'Bài thi đã được đặt riêng tư (chỉ user được gán)'
    })
  } catch (error: any) {
    console.error('Error toggling exam public status:', error)
    return NextResponse.json({ error: 'Lỗi khi thay đổi trạng thái public của bài thi' }, { status: 500 })
  }
}

