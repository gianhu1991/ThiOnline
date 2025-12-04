import { NextRequest, NextResponse } from 'next/server'
import { getJWT } from '@/lib/jwt'
import { isSuperAdminByUsername } from '@/lib/super-admin'

// Kiểm tra xem user hiện tại có phải là super admin không
export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    console.log('[Check Super Admin API] JWT user:', user)
    
    if (!user || user.role !== 'admin') {
      console.log('[Check Super Admin API] User not admin or not authenticated')
      return NextResponse.json({ isSuperAdmin: false })
    }

    console.log('[Check Super Admin API] Checking username:', user.username)
    const isSuperAdmin = await isSuperAdminByUsername(user.username)
    console.log('[Check Super Admin API] Result:', isSuperAdmin)

    return NextResponse.json({ isSuperAdmin })
  } catch (error: any) {
    console.error('Error checking super admin:', error)
    return NextResponse.json({ isSuperAdmin: false })
  }
}

