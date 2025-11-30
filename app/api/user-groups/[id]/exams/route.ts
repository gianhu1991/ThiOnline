import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// POST: Gán/xóa bài thi cho nhóm
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được quản lý bài thi cho nhóm' }, { status: 403 })
    }

    const body = await request.json()
    const { examIds, action } = body // action: 'add' hoặc 'remove'

    if (!Array.isArray(examIds) || examIds.length === 0) {
      return NextResponse.json({ error: 'Vui lòng chọn ít nhất một bài thi' }, { status: 400 })
    }

    if (action !== 'add' && action !== 'remove') {
      return NextResponse.json({ error: 'Action phải là "add" hoặc "remove"' }, { status: 400 })
    }

    // Kiểm tra nhóm có tồn tại không
    const group = await prisma.userGroup.findUnique({
      where: { id: params.id },
    })

    if (!group) {
      return NextResponse.json({ error: 'Không tìm thấy nhóm' }, { status: 404 })
    }

    if (action === 'add') {
      // Gán bài thi cho nhóm (bỏ qua nếu đã tồn tại)
      await prisma.examGroup.createMany({
        data: examIds.map((examId: string) => ({
          examId,
          groupId: params.id,
        })),
        skipDuplicates: true,
      })
    } else {
      // Xóa bài thi khỏi nhóm
      await prisma.examGroup.deleteMany({
        where: {
          groupId: params.id,
          examId: { in: examIds },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error managing group exams:', error)
    return NextResponse.json({ error: 'Lỗi khi quản lý bài thi: ' + error.message }, { status: 500 })
  }
}

