import { NextRequest, NextResponse } from 'next/server'
import { getJWT } from '@/lib/jwt'
import { checkPermission } from '@/lib/check-permission'
import { PERMISSIONS } from '@/lib/permissions'

/**
 * API route để check permission - có thể gọi từ middleware (Edge Runtime)
 * Usage: GET /api/auth/check-permission?permission=view_exams
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user || !user.role) {
      return NextResponse.json({ allowed: false, reason: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const permissionCode = searchParams.get('permission')

    if (!permissionCode) {
      return NextResponse.json({ allowed: false, reason: 'Permission code required' }, { status: 400 })
    }

    // Admin và Leader luôn được phép
    if (user.role === 'admin' || user.role === 'leader') {
      return NextResponse.json({ allowed: true, reason: 'Admin/Leader bypass' })
    }

    // Check permission
    const result = await checkPermission(user.userId, user.role, permissionCode, user.username)
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[check-permission API] Error:', error)
    return NextResponse.json({ 
      allowed: false, 
      reason: `Error: ${error.message}` 
    }, { status: 500 })
  }
}

