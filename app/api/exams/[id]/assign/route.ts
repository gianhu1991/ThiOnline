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

    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json({ error: 'Lỗi khi đọc dữ liệu yêu cầu' }, { status: 400 })
    }

    const { userIds } = body // Array of user IDs
    console.log('Received userIds:', userIds)

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Vui lòng chọn ít nhất một người dùng' }, { status: 400 })
    }

    console.log('Exam ID:', params.id)
    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
    })

    if (!exam) {
      console.error('Exam not found:', params.id)
      return NextResponse.json({ error: 'Không tìm thấy bài thi' }, { status: 404 })
    }

    console.log('Exam found:', exam.title)

    // Kiểm tra user có tồn tại không
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
    })

    console.log('Found users:', users.length, 'Requested:', userIds.length)

    if (users.length !== userIds.length) {
      const foundUserIds = users.map(u => u.id)
      const missingUserIds = userIds.filter(id => !foundUserIds.includes(id))
      console.error('Missing users:', missingUserIds)
      return NextResponse.json({ 
        error: 'Một số người dùng không tồn tại',
        missingUserIds 
      }, { status: 400 })
    }

    // Gán bài thi cho các user (sử dụng createMany với skipDuplicates)
    try {
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
    } catch (dbError: any) {
      // Nếu lỗi do duplicate (đã được gán rồi), vẫn coi là thành công
      if (dbError.code === 'P2002' || dbError.message?.includes('Unique constraint')) {
        // Thử gán từng user một để xem có bao nhiêu user đã được gán
        let successCount = 0
        for (const userId of userIds) {
          try {
            await prisma.examAssignment.create({
              data: {
                examId: params.id,
                userId,
              },
            })
            successCount++
          } catch (e: any) {
            // Bỏ qua nếu đã tồn tại
            if (e.code !== 'P2002' && !e.message?.includes('Unique constraint')) {
              throw e
            }
          }
        }
        return NextResponse.json({ 
          success: true, 
          message: `Đã gán bài thi cho ${successCount} người dùng${successCount < userIds.length ? ' (một số người dùng đã được gán trước đó)' : ''}`,
          count: successCount
        })
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error assigning exam:', error)
    // Trả về thông báo lỗi chi tiết hơn
    const errorMessage = error.message || 'Lỗi khi gán bài thi'
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
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

