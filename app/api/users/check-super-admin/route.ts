import { NextRequest, NextResponse } from 'next/server'
import { getJWT } from '@/lib/jwt'
import { isSuperAdminByUsername } from '@/lib/super-admin'

// Kiểm tra xem user hiện tại có phải là super admin không
export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    console.log('[Check Super Admin API] JWT user:', user)
    
    if (!user) {
      console.log('[Check Super Admin API] User not authenticated')
      return NextResponse.json({ isSuperAdmin: false })
    }

    console.log('[Check Super Admin API] Checking username:', user.username, 'Type:', typeof user.username, 'Role:', user.role)
    
    // Kiểm tra trực tiếp: nếu username là "admin" (case-insensitive) thì là Super Admin
    // Không cần kiểm tra role vì username "admin" luôn là Super Admin
    const normalizedUsername = user.username?.trim().toLowerCase()
    if (normalizedUsername === 'admin') {
      console.log('[Check Super Admin API] Username is "admin", returning true (Super Admin)')
      return NextResponse.json({ isSuperAdmin: true })
    }
    
    // Nếu không phải "admin", kiểm tra role phải là "admin"
    if (user.role !== 'admin') {
      console.log('[Check Super Admin API] User role is not admin:', user.role)
      return NextResponse.json({ isSuperAdmin: false })
    }
    
    // Kiểm tra từ database
    const isSuperAdmin = await isSuperAdminByUsername(user.username)
    console.log('[Check Super Admin API] Result from isSuperAdminByUsername:', isSuperAdmin)

    return NextResponse.json({ isSuperAdmin })
  } catch (error: any) {
    console.error('Error checking super admin:', error)
    return NextResponse.json({ isSuperAdmin: false })
  }
}

