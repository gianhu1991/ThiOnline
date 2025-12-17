import { NextRequest, NextResponse } from 'next/server'
import { getJWT } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

/**
 * API để lấy tất cả permissions của user hiện tại
 * Frontend sẽ gọi API này để biết user có quyền gì
 * OPTIMIZED: Load tất cả permissions trong 3 queries thay vì N queries
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    // Query 1: Lấy tất cả permissions
    const allPermissions = await prisma.permission.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        category: true
      }
    })

    // Query 2: Lấy tất cả RolePermissions cho role này
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role: user.role },
      select: { permissionId: true }
    })
    const rolePermissionIds = new Set(rolePermissions.map(rp => rp.permissionId))

    // Query 3: Lấy tất cả UserPermissions cho user này
    const userPermissionOverrides = await prisma.userPermission.findMany({
      where: { userId: user.userId },
      select: { 
        permissionId: true,
        type: true 
      }
    })
    
    // Tạo map UserPermissions
    const userPermMap = new Map<string, 'grant' | 'deny'>()
    userPermissionOverrides.forEach(up => {
      userPermMap.set(up.permissionId, up.type)
    })

    // Tính toán permissions: UserPermission (deny) > UserPermission (grant) > RolePermission
    const userPermissions: { [key: string]: boolean } = {}
    
    for (const perm of allPermissions) {
      const userOverride = userPermMap.get(perm.id)
      
      if (userOverride === 'deny') {
        userPermissions[perm.code] = false
      } else if (userOverride === 'grant') {
        userPermissions[perm.code] = true
      } else {
        userPermissions[perm.code] = rolePermissionIds.has(perm.id)
      }
    }

    return NextResponse.json({ 
      permissions: userPermissions,
      role: user.role,
      username: user.username
    })
  } catch (error: any) {
    console.error('[/api/auth/permissions] Error:', error)
    
    // Nếu bảng Permission chưa tồn tại, trả về empty permissions
    // Frontend sẽ fallback về role-based
    const user = await getJWT(request)
    return NextResponse.json({ 
      permissions: {},
      role: user?.role || null,
      username: user?.username || null
    }, { status: 200 })
  }
}

