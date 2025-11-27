import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// Gán bài thi cho user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được gán bài thi' }, { status: 403 })
    }

    const body = await request.json()
    const { userIds } = body // Array of user IDs

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Vui lòng chọn ít nhất một người dùng' }, { status: 400 })
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Không tìm thấy bài thi' }, { status: 404 })
    }

    // Kiểm tra user có tồn tại không
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
    })

    if (users.length !== userIds.length) {
      return NextResponse.json({ error: 'Một số người dùng không tồn tại' }, { status: 400 })
    }

    // Gán bài thi cho các user (sử dụng createMany với skipDuplicates)
    const assignments = await prisma.examAssignment.createMany({
      data: userIds.map((userId: string) => ({
        examId: params.id,
        userId,
      })),
      skipDuplicates: true, // Bỏ qua nếu đã được gán rồi
    })

    return NextResponse.json({ 
      success: true, 
      message: `Đã gán bài thi cho ${assignments.count} người dùng`,
      count: assignments.count
    })
  } catch (error: any) {
    console.error('Error assigning exam:', error)
    return NextResponse.json({ error: 'Lỗi khi gán bài thi' }, { status: 500 })
  }
}

// Hủy gán bài thi cho user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được hủy gán bài thi' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 })
    }

    await prisma.examAssignment.deleteMany({
      where: {
        examId: params.id,
        userId,
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Đã hủy gán bài thi cho người dùng'
    })
  } catch (error: any) {
    console.error('Error unassigning exam:', error)
    return NextResponse.json({ error: 'Lỗi khi hủy gán bài thi' }, { status: 500 })
  }
}

// Lấy danh sách user được gán bài thi
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xem danh sách gán bài thi' }, { status: 403 })
    }

    const assignments = await prisma.examAssignment.findMany({
      where: { examId: params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    })

    return NextResponse.json({ 
      success: true, 
      assignments: assignments.map(a => ({
        id: a.id,
        userId: a.userId,
        username: a.user.username,
        fullName: a.user.fullName,
        email: a.user.email,
        assignedAt: a.assignedAt,
      }))
    })
  } catch (error: any) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách gán bài thi' }, { status: 500 })
  }
}

