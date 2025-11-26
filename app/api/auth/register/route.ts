import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password, fullName, email } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 })
    }

    // Kiểm tra username đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 409 })
    }

    // Tạo user mới
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'user', // Mặc định là user
        fullName: fullName || null,
        email: email || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Đăng ký thành công',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Lỗi khi đăng ký: ' + (error.message || 'Unknown error') }, { status: 500 })
  }
}

