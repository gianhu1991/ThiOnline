import { NextRequest, NextResponse } from 'next/server'
import { getJWT } from '@/lib/jwt'
import { isSuperAdminByUsername } from '@/lib/super-admin'

// Kiểm tra xem user hiện tại có phải là super admin không
export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ isSuperAdmin: false })
    }

    const isSuperAdmin = await isSuperAdminByUsername(user.username)

    return NextResponse.json({ isSuperAdmin })
  } catch (error: any) {
    console.error('Error checking super admin:', error)
    return NextResponse.json({ isSuperAdmin: false })
  }
}

