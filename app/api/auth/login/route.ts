import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production')

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 })
    }

    const user = await authenticateUser(username, password)

    if (!user) {
      return NextResponse.json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' }, { status: 401 })
    }

    // Tạo JWT token
    const token = await new SignJWT({ userId: user.id, username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret)

    const response = NextResponse.json({ success: true, user: { username: user.username } })
    
    // Set cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    // Kiểm tra nếu bảng User chưa tồn tại
    if (error.message?.includes('does not exist') || error.code === 'P2021' || error.message?.includes('User')) {
      return NextResponse.json({ 
        error: 'Hệ thống chưa được khởi tạo. Vui lòng tạo user admin trước.' 
      }, { status: 500 })
    }
    return NextResponse.json({ 
      error: 'Lỗi khi đăng nhập: ' + (error.message || 'Unknown error') 
    }, { status: 500 })
  }
}

