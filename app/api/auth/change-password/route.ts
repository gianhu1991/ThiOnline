import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { getJWT } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const user = await getJWT(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Người dùng không tồn tại' }, { status: 404 })
    }

    const isValid = await verifyPassword(currentPassword, dbUser.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 401 })
    }

    const hashedPassword = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.userId },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công' })
  } catch (error: any) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Lỗi khi đổi mật khẩu' }, { status: 500 })
  }
}

