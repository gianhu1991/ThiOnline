import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hasPermission, PERMISSIONS, invalidatePermissionsCache } from '@/lib/permissions'

// Lấy permissions của một role
export async function GET(
  request: NextRequest,
  { params }: { params: { role: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    // Chỉ admin hoặc người có quyền manage_permissions mới xem được
    const canManage = await hasPermission(user.role, PERMISSIONS.MANAGE_PERMISSIONS)
    if (!canManage) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
    }

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role: params.role },
      include: {
        permission: true
      }
    })

    const permissionCodes = rolePermissions.map(rp => rp.permission.code)

    return NextResponse.json({
      success: true,
      role: params.role,
      permissions: permissionCodes
    })
  } catch (error: any) {
    console.error('Error fetching role permissions:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy quyền của role' }, { status: 500 })
  }
}

// Cập nhật permissions cho một role
export async function PUT(
  request: NextRequest,
  { params }: { params: { role: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    // Chỉ admin hoặc người có quyền manage_permissions mới cập nhật được
    const canManage = await hasPermission(user.role, PERMISSIONS.MANAGE_PERMISSIONS)
    if (!canManage) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
    }

    const { permissionCodes } = await request.json()

    if (!Array.isArray(permissionCodes)) {
      return NextResponse.json({ error: 'permissionCodes phải là array' }, { status: 400 })
    }

    // Kiểm tra tất cả permissionCodes có tồn tại không
    const permissions = await prisma.permission.findMany({
      where: {
        code: { in: permissionCodes }
      }
    })

    if (permissions.length !== permissionCodes.length) {
      return NextResponse.json({ error: 'Có permission code không hợp lệ' }, { status: 400 })
    }

    // Xóa tất cả permissions cũ của role
    await prisma.rolePermission.deleteMany({
      where: { role: params.role }
    })

    // Tạo permissions mới
    await prisma.rolePermission.createMany({
      data: permissions.map(perm => ({
        role: params.role,
        permissionId: perm.id
      }))
    })

    // Invalidate cache
    invalidatePermissionsCache()

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật quyền cho role ${params.role}`
    })
  } catch (error: any) {
    console.error('Error updating role permissions:', error)
    return NextResponse.json({ error: 'Lỗi khi cập nhật quyền' }, { status: 500 })
  }
}

