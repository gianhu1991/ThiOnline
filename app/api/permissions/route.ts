import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// Lấy danh sách tất cả permissions
export async function GET(request: NextRequest) {
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

    // Lấy tất cả permissions, nhóm theo category
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { code: 'asc' }
      ]
    })

    // Nhóm theo category
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = []
      }
      acc[perm.category].push(perm)
      return acc
    }, {} as Record<string, typeof permissions>)

    return NextResponse.json({
      success: true,
      permissions,
      grouped
    })
  } catch (error: any) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách quyền' }, { status: 500 })
  }
}

