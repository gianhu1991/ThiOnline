import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// POST: Gán/xóa tài liệu cho nhóm
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được quản lý tài liệu cho nhóm' }, { status: 403 })
    }

    const body = await request.json()
    const { documentIds, action } = body // action: 'add' hoặc 'remove'

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Vui lòng chọn ít nhất một tài liệu' }, { status: 400 })
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
      // Gán tài liệu cho nhóm (bỏ qua nếu đã tồn tại)
      await prisma.documentGroup.createMany({
        data: documentIds.map((documentId: string) => ({
          documentId,
          groupId: params.id,
        })),
        skipDuplicates: true,
      })
    } else {
      // Xóa tài liệu khỏi nhóm
      await prisma.documentGroup.deleteMany({
        where: {
          groupId: params.id,
          documentId: { in: documentIds },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error managing group documents:', error)
    return NextResponse.json({ error: 'Lỗi khi quản lý tài liệu: ' + error.message }, { status: 500 })
  }
}

