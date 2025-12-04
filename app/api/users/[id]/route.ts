import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hashPassword } from '@/lib/auth'
import { isSuperAdminByUsername } from '@/lib/super-admin'

// Xóa user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xóa user' }, { status: 403 })
    }

    // Không cho phép xóa chính mình
    if (user.userId === params.id) {
      return NextResponse.json({ error: 'Bạn không thể xóa chính mình' }, { status: 400 })
    }

    // Kiểm tra user có tồn tại không
    const userToDelete = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 })
    }

    // Kiểm tra xem có phải super admin không
    const isUserSuperAdmin = await isSuperAdminByUsername(user.username)
    
    // Chỉ super admin mới có thể xóa admin khác
    if (userToDelete.role === 'admin' && !isUserSuperAdmin) {
      return NextResponse.json({ error: 'Chỉ Super Admin mới có thể xóa tài khoản admin khác' }, { status: 403 })
    }
    
    // Không cho phép xóa user "admin" (Super Admin)
    if (userToDelete.username === 'admin') {
      return NextResponse.json({ error: 'Không thể xóa tài khoản Super Admin' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: 'Xóa user thành công' })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Lỗi khi xóa user' }, { status: 500 })
  }
}

// Cập nhật user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được sửa user' }, { status: 403 })
    }

    const body = await request.json()
    const { username, fullName, email, password, role } = body

    // Kiểm tra user có tồn tại không
    const userToUpdate = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!userToUpdate) {
      return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 })
    }

    // Kiểm tra xem có phải super admin không
    const isUserSuperAdmin = await isSuperAdminByUsername(user.username)
    
    // Không cho phép thay đổi thông tin user "admin" (Super Admin) trừ khi chính Super Admin
    if (userToUpdate.username === 'admin' && !isUserSuperAdmin) {
      return NextResponse.json({ error: 'Chỉ Super Admin mới có thể thay đổi thông tin tài khoản Super Admin' }, { status: 403 })
    }
    
    // Chỉ super admin mới có thể thay đổi role thành admin hoặc thay đổi role của admin khác
    if (role === 'admin' && !isUserSuperAdmin) {
      return NextResponse.json({ error: 'Chỉ Super Admin mới có thể tạo hoặc thay đổi role thành admin' }, { status: 403 })
    }
    
    // Chỉ super admin mới có thể thay đổi role của admin khác
    if (userToUpdate.role === 'admin' && role !== 'admin' && user.userId !== params.id && !isUserSuperAdmin) {
      return NextResponse.json({ error: 'Chỉ Super Admin mới có thể thay đổi role của admin khác' }, { status: 403 })
    }

    // Không cho phép tự hạ cấp (từ admin xuống user)
    if (user.userId === params.id && userToUpdate.role === 'admin' && role !== 'admin') {
      return NextResponse.json({ error: 'Bạn không thể tự hạ cấp mình' }, { status: 400 })
    }

    // Kiểm tra username đã tồn tại chưa (nếu thay đổi)
    if (username && username !== userToUpdate.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      })
      if (existingUser) {
        return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 409 })
      }
    }

    // Hash password nếu có
    const updateData: any = {}
    if (username) updateData.username = username
    if (fullName !== undefined) updateData.fullName = fullName || null
    if (email !== undefined) updateData.email = email || null
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 })
      }
      updateData.password = await hashPassword(password)
    }
    if (role) {
      // Super admin có thể thay đổi role của bất kỳ ai, kể cả chính mình
      // Admin thường chỉ có thể thay đổi role của user khác
      if (isUserSuperAdmin || user.userId !== params.id) {
        updateData.role = role
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, user: updatedUser, message: 'Cập nhật user thành công' })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Lỗi khi cập nhật user: ' + (error.message || 'Unknown error') }, { status: 500 })
  }
}

