import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hashPassword } from '@/lib/auth'
import { isSuperAdminByUsername } from '@/lib/super-admin'

// Lấy danh sách tất cả user (chỉ admin)
export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xem danh sách user' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, users })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách user' }, { status: 500 })
  }
}

// Tạo user mới (chỉ Super Admin)
export async function POST(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được tạo user' }, { status: 403 })
    }

    // Kiểm tra Super Admin
    const isUserSuperAdmin = await isSuperAdminByUsername(user.username)
    
    if (!isUserSuperAdmin) {
      return NextResponse.json({ error: 'Chỉ Super Admin mới được tạo user mới' }, { status: 403 })
    }

    const { username, password, fullName, email, role } = await request.json()

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

    // Không cho phép tạo user với username "admin"
    if (username === 'admin') {
      return NextResponse.json({ error: 'Không thể tạo user với username "admin"' }, { status: 400 })
    }

    // Tạo user mới
    const hashedPassword = await hashPassword(password)
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'user', // Mặc định là user, Super Admin có thể tạo admin
        fullName: fullName || null,
        email: email || null,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Tạo user thành công',
      user: newUser,
    })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Lỗi khi tạo user: ' + (error.message || 'Unknown error') }, { status: 500 })
  }
}

