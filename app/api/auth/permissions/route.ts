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
    console.log('[GET /api/auth/permissions] ========== START ==========')
    const user = await getJWT(request)
    console.log('[GET /api/auth/permissions] JWT user:', { userId: user?.userId, username: user?.username, role: user?.role })
    
    if (!user || !user.role) {
      console.log('[GET /api/auth/permissions] ❌ No user or role')
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    // BẮT BUỘC: Tìm userId đúng từ database bằng username (vì username là unique và đáng tin cậy)
    if (!user.username) {
      console.log('[GET /api/auth/permissions] ❌ No username in JWT')
      return NextResponse.json({ error: 'Username không tồn tại trong JWT' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { username: user.username },
      select: { id: true, username: true, role: true }
    })

    if (!dbUser) {
      console.log('[GET /api/auth/permissions] ❌ User not found in database:', user.username)
      return NextResponse.json({ error: 'User không tồn tại trong database' }, { status: 404 })
    }

    const correctUserId = dbUser.id
    console.log('[GET /api/auth/permissions] ✅ Found correct userId:', {
      jwtUserId: user.userId,
      correctUserId,
      username: user.username,
      match: user.userId === correctUserId
    })
    
    // Log warning nếu userId không match
    if (user.userId !== correctUserId) {
      console.warn('[GET /api/auth/permissions] ⚠️ userId mismatch!')
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

    // Query 3: Lấy tất cả UserPermissions cho user này (dùng correctUserId)
    console.log('[GET /api/auth/permissions] 🔍 Fetching UserPermissions with userId:', correctUserId)
    const userPermissionOverrides = await prisma.userPermission.findMany({
      where: { userId: correctUserId },
      select: { 
        permissionId: true,
        type: true 
      }
    })
    console.log('[GET /api/auth/permissions] 📊 UserPermissions found:', {
      count: userPermissionOverrides.length,
      grants: userPermissionOverrides.filter(up => up.type === 'grant').length,
      denies: userPermissionOverrides.filter(up => up.type === 'deny').length
    })
    
    // Tạo map UserPermissions
    const userPermMap = new Map<string, string>()
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

    const grantedPerms = Object.entries(userPermissions).filter(([_, v]) => v).map(([k]) => k)
    console.log('[GET /api/auth/permissions] ✅ Final permissions:', {
      total: Object.keys(userPermissions).length,
      granted: grantedPerms.length,
      grantedList: grantedPerms
    })
    console.log('[GET /api/auth/permissions] ========== END ==========')
    
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

