import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'

// Đảm bảo route này luôn dynamic, không cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log('[GET /api/exams] ========== START ==========')
    const user = await getJWT(request)
    console.log('[GET /api/exams] JWT user:', { userId: user?.userId, username: user?.username, role: user?.role })
    
    if (!user || !user.role) {
      console.log('[GET /api/exams] ❌ No user or role')
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    // Tìm userId đúng từ database
    let correctUserId = user.userId
    if (user.username) {
      const dbUser = await prisma.user.findUnique({
        where: { username: user.username },
        select: { id: true, username: true, role: true }
      })
      if (dbUser) {
        correctUserId = dbUser.id
        console.log('[GET /api/exams] ✅ Found correct userId:', { 
          jwtUserId: user.userId, 
          correctUserId, 
          username: user.username,
          match: user.userId === correctUserId
        })
      } else {
        console.log('[GET /api/exams] ❌ User not found in database:', user.username)
      }
    }
    
    // Admin luôn được phép
    if (user.role !== 'admin') {
      // Kiểm tra quyền VIEW_EXAMS (bao gồm cả đặc cách)
      console.log('[GET /api/exams] 🔍 Checking permission VIEW_EXAMS...')
      const canView = await hasUserPermission(user.userId, user.role, PERMISSIONS.VIEW_EXAMS, user.username)
      console.log('[GET /api/exams] 📊 Permission check result:', {
        jwtUserId: user.userId,
        correctUserId,
        username: user.username,
        role: user.role,
        permission: PERMISSIONS.VIEW_EXAMS,
        canView
      })
      if (!canView) {
        console.log('[GET /api/exams] ❌ Permission denied - returning 403')
        return NextResponse.json({ error: 'Bạn không có quyền xem danh sách bài thi' }, { status: 403 })
      }
      console.log('[GET /api/exams] ✅ Permission granted')
    } else {
      console.log('[GET /api/exams] ✅ Admin - bypassing permission check')
    }
    
    console.log('[GET /api/exams] 📥 Fetching exams from database...')
    
    // Kiểm tra kết nối database
    const examCount = await prisma.exam.count()
    console.log('[GET /api/exams] Tổng số bài thi trong database:', examCount)
    
    // Kiểm tra query parameter để xem có cần full data không
    const { searchParams } = new URL(request.url)
    const fullData = searchParams.get('full') === 'true'
    
    // Tách thành 2 query riêng để TypeScript hiểu đúng kiểu
    let exams
    if (fullData) {
      exams = await prisma.exam.findMany({
        include: {
          _count: {
            select: { examResults: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      // Chỉ select fields cần thiết nếu không cần full data (tối ưu cho dropdown)
      exams = await prisma.exam.findMany({
        select: {
          id: true,
          title: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    }
    
    console.log('[GET /api/exams] ✅ Returning exams:', { count: exams.length })
    console.log('[GET /api/exams] ========== END ==========')
    
    // Đảm bảo mỗi exam đều có _count với giá trị mặc định nếu không có
    if (fullData && Array.isArray(exams)) {
      exams = exams.map((exam: any) => ({
        ...exam,
        _count: exam._count || { examResults: 0 }
      }))
    }
    
    return NextResponse.json(exams, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('[GET /api/exams] Lỗi khi lấy danh sách bài thi:', error)
    console.error('[GET /api/exams] Error message:', error.message)
    console.error('[GET /api/exams] Error code:', error.code)
    console.error('[GET /api/exams] Error stack:', error.stack)
    
    // Nếu bảng chưa tồn tại, trả về mảng rỗng
    if (error.message?.includes('does not exist') || error.code === 'P2021') {
      console.log('[GET /api/exams] Bảng Exam chưa tồn tại, trả về mảng rỗng')
      return NextResponse.json([])
    }
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách bài thi: ' + error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    // Admin luôn được phép
    if (user.role !== 'admin') {
      // Kiểm tra quyền CREATE_EXAMS (bao gồm cả đặc cách)
      const canCreate = await hasUserPermission(user.userId, user.role, PERMISSIONS.CREATE_EXAMS, user.username)
      if (!canCreate) {
        return NextResponse.json({ error: 'Bạn không có quyền tạo bài thi' }, { status: 403 })
      }
    }
    
    const body = await request.json()
    const {
      title,
      description,
      questionCount,
      timeLimit,
      startDate,
      endDate,
      shuffleQuestions,
      shuffleAnswers,
      maxAttempts,
      categories, // Array of category names hoặc null
    } = body

    // Lấy câu hỏi từ ngân hàng, lọc theo category nếu có
    let allQuestions
    if (categories && Array.isArray(categories) && categories.length > 0) {
      // Lọc theo các category đã chọn
      allQuestions = await prisma.question.findMany({
        where: {
          category: {
            in: categories,
          },
        },
      })
    } else {
      // Lấy tất cả câu hỏi nếu không chọn category
      allQuestions = await prisma.question.findMany()
    }
    
    if (allQuestions.length < questionCount) {
      const categoryInfo = categories && categories.length > 0 
        ? ` trong ${categories.length} lĩnh vực đã chọn`
        : ''
      return NextResponse.json({ 
        error: `Ngân hàng câu hỏi${categoryInfo} chỉ có ${allQuestions.length} câu, không đủ ${questionCount} câu` 
      }, { status: 400 })
    }

    // Trộn và chọn ngẫu nhiên
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5)
    const selectedQuestions = shuffled.slice(0, questionCount)

    // datetime-local input trả về local time (không có timezone)
    // Cần convert sang UTC để lưu vào database
    const parseLocalDateTime = (dateTimeString: string) => {
      // Tạo Date object từ local time string
      // "2025-11-26T14:20" -> được interpret như local time
      return new Date(dateTimeString)
    }

    // Tạo bài thi
    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        questionCount,
        timeLimit,
        startDate: parseLocalDateTime(startDate),
        endDate: parseLocalDateTime(endDate),
        isActive: true, // Mặc định là bật
        isPublic: false, // Mặc định là không công khai (chỉ user được gán mới làm được)
        shuffleQuestions: shuffleQuestions || false,
        shuffleAnswers: shuffleAnswers || false,
        requireAllQuestions: body.requireAllQuestions || false,
        maxAttempts: maxAttempts || 1,
        examQuestions: {
          create: selectedQuestions.map((q, index) => ({
            questionId: q.id,
            order: index + 1,
          })),
        },
      },
      include: {
        examQuestions: true,
      },
    })

    return NextResponse.json(exam)
  } catch (error: any) {
    console.error('Create exam error:', error)
    return NextResponse.json({ 
      error: 'Lỗi khi tạo bài thi: ' + error.message 
    }, { status: 500 })
  }
}

