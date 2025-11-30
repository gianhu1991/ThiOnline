import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// POST: Gán/xóa video cho nhóm
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được quản lý video cho nhóm' }, { status: 403 })
    }

    const body = await request.json()
    const { videoIds, action } = body // action: 'add' hoặc 'remove'

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json({ error: 'Vui lòng chọn ít nhất một video' }, { status: 400 })
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
      // Gán video cho nhóm (bỏ qua nếu đã tồn tại)
      await prisma.videoGroup.createMany({
        data: videoIds.map((videoId: string) => ({
          videoId,
          groupId: params.id,
        })),
        skipDuplicates: true,
      })
    } else {
      // Xóa video khỏi nhóm
      await prisma.videoGroup.deleteMany({
        where: {
          groupId: params.id,
          videoId: { in: videoIds },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error managing group videos:', error)
    return NextResponse.json({ error: 'Lỗi khi quản lý video: ' + error.message }, { status: 500 })
  }
}

