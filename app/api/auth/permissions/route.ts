import { NextRequest, NextResponse } from 'next/server'
import { getJWT } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { hasUserPermission } from '@/lib/permissions'

/**
 * API để lấy tất cả permissions của user hiện tại
 * Frontend sẽ gọi API này để biết user có quyền gì
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    // Lấy tất cả permissions
    const allPermissions = await prisma.permission.findMany({
      select: {
        code: true,
        name: true,
        category: true
      }
    })

    // Kiểm tra từng permission xem user có quyền không
    const userPermissions: { [key: string]: boolean } = {}
    
    for (const perm of allPermissions) {
      userPermissions[perm.code] = await hasUserPermission(user.userId, user.role, perm.code)
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

