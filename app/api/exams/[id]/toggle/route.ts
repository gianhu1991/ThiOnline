import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được thay đổi trạng thái bài thi' }, { status: 403 })
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Không tìm thấy bài thi' }, { status: 404 })
    }

    // Toggle trạng thái isActive
    const updatedExam = await prisma.exam.update({
      where: { id: params.id },
      data: {
        isActive: !exam.isActive,
      },
    })

    return NextResponse.json({ 
      success: true, 
      exam: updatedExam,
      message: updatedExam.isActive ? 'Bài thi đã được mở' : 'Bài thi đã được tắt'
    })
  } catch (error: any) {
    console.error('Error toggling exam status:', error)
    return NextResponse.json({ error: 'Lỗi khi thay đổi trạng thái bài thi' }, { status: 500 })
  }
}

