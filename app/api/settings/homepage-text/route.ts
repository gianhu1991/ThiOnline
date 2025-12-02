import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// GET: Lấy text hiện tại
export async function GET(request: NextRequest) {
  try {
    const [title, subtitle, description] = await Promise.all([
      prisma.settings.findUnique({ where: { key: 'homepage_title' } }),
      prisma.settings.findUnique({ where: { key: 'homepage_subtitle' } }),
      prisma.settings.findUnique({ where: { key: 'homepage_description' } }),
    ])

    return NextResponse.json({ 
      success: true, 
      title: title?.value || 'TTVT Nho Quan',
      subtitle: subtitle?.value || 'Phần mềm đào tạo kỹ thuật',
      description: description?.value || 'Quản lý ngân hàng câu hỏi, tạo bài thi và tổ chức thi trắc nghiệm trực tuyến một cách dễ dàng và hiệu quả',
    })
  } catch (error: any) {
    console.error('Error fetching homepage text:', error)
    return NextResponse.json({ 
      success: true, 
      title: 'TTVT Nho Quan',
      subtitle: 'Phần mềm đào tạo kỹ thuật',
      description: 'Quản lý ngân hàng câu hỏi, tạo bài thi và tổ chức thi trắc nghiệm trực tuyến một cách dễ dàng và hiệu quả',
    })
  }
}

// PUT: Cập nhật text
export async function PUT(request: NextRequest) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được thay đổi nội dung' }, { status: 403 })
    }

    const { title, subtitle, description } = await request.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Tiêu đề không được để trống' }, { status: 400 })
    }

    if (!subtitle || !subtitle.trim()) {
      return NextResponse.json({ error: 'Phụ đề không được để trống' }, { status: 400 })
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Mô tả không được để trống' }, { status: 400 })
    }

    // Lưu vào database
    await Promise.all([
      prisma.settings.upsert({
        where: { key: 'homepage_title' },
        update: { value: title.trim() },
        create: { key: 'homepage_title', value: title.trim() },
      }),
      prisma.settings.upsert({
        where: { key: 'homepage_subtitle' },
        update: { value: subtitle.trim() },
        create: { key: 'homepage_subtitle', value: subtitle.trim() },
      }),
      prisma.settings.upsert({
        where: { key: 'homepage_description' },
        update: { value: description.trim() },
        create: { key: 'homepage_description', value: description.trim() },
      }),
    ])

    return NextResponse.json({ 
      success: true,
      message: 'Cập nhật nội dung trang chủ thành công'
    })
  } catch (error: any) {
    console.error('Error updating homepage text:', error)
    return NextResponse.json({ 
      error: `Lỗi khi cập nhật nội dung: ${error.message || 'Unknown error'}` 
    }, { status: 500 })
  }
}

