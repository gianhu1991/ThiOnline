import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// Lấy permissions đặc biệt của một user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    // Chỉ admin hoặc người có quyền manage_permissions mới xem được
    const canManage = await hasPermission(user.role, PERMISSIONS.MANAGE_PERMISSIONS)
    if (!canManage) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
    }

    // Lấy thông tin user
    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 })
    }

    // Lấy user permissions
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId: params.userId },
      include: {
        permission: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Lấy role permissions để so sánh
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role: targetUser.role },
      include: {
        permission: true
      }
    })

    const rolePermCodes = rolePermissions.map(rp => rp.permission.code)

    return NextResponse.json({
      success: true,
      user: targetUser,
      userPermissions: userPermissions.map(up => ({
        code: up.permission.code,
        name: up.permission.name,
        category: up.permission.category,
        type: up.type,
        reason: up.reason,
        grantedBy: up.grantedBy,
        createdAt: up.createdAt
      })),
      rolePermissions: rolePermCodes
    })
  } catch (error: any) {
    console.error('Error fetching user permissions:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy quyền của user' }, { status: 500 })
  }
}

// Cập nhật permissions đặc biệt cho một user
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    // Chỉ admin hoặc người có quyền manage_permissions mới cập nhật được
    const canManage = await hasPermission(user.role, PERMISSIONS.MANAGE_PERMISSIONS)
    if (!canManage) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
    }

    const { grants, denies, reason } = await request.json()

    if (!Array.isArray(grants) || !Array.isArray(denies)) {
      return NextResponse.json({ error: 'grants và denies phải là array' }, { status: 400 })
    }

    // Kiểm tra user tồn tại
    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 })
    }

    // Xóa tất cả user permissions cũ
    await prisma.userPermission.deleteMany({
      where: { userId: params.userId }
    })

    // Tạo grants (cấp thêm quyền)
    if (grants.length > 0) {
      const grantPerms = await prisma.permission.findMany({
        where: { code: { in: grants } }
      })

      await prisma.userPermission.createMany({
        data: grantPerms.map(perm => ({
          userId: params.userId,
          permissionId: perm.id,
          type: 'grant',
          grantedBy: user.username,
          reason: reason || null
        }))
      })
    }

    // Tạo denies (gỡ bỏ quyền)
    if (denies.length > 0) {
      const denyPerms = await prisma.permission.findMany({
        where: { code: { in: denies } }
      })

      await prisma.userPermission.createMany({
        data: denyPerms.map(perm => ({
          userId: params.userId,
          permissionId: perm.id,
          type: 'deny',
          grantedBy: user.username,
          reason: reason || null
        }))
      })
    }

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật quyền đặc biệt cho user ${targetUser.username}`
    })
  } catch (error: any) {
    console.error('Error updating user permissions:', error)
    return NextResponse.json({ error: 'Lỗi khi cập nhật quyền' }, { status: 500 })
  }
}

// Xóa tất cả permissions đặc biệt của user (reset về role permission)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    // Chỉ admin hoặc người có quyền manage_permissions mới xóa được
    const canManage = await hasPermission(user.role, PERMISSIONS.MANAGE_PERMISSIONS)
    if (!canManage) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
    }

    await prisma.userPermission.deleteMany({
      where: { userId: params.userId }
    })

    return NextResponse.json({
      success: true,
      message: 'Đã xóa tất cả quyền đặc biệt'
    })
  } catch (error: any) {
    console.error('Error deleting user permissions:', error)
    return NextResponse.json({ error: 'Lỗi khi xóa quyền' }, { status: 500 })
  }
}

