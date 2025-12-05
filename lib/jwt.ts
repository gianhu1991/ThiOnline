import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production')

export async function getJWT(request: NextRequest) {
  try {
    // Lấy token từ cookie (web app) hoặc Authorization header (mobile app)
    let token = request.cookies.get('auth-token')?.value
    
    // Nếu không có trong cookie, thử lấy từ Authorization header
    if (!token) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, secret)
    return payload as { userId: string; username: string; role?: string }
  } catch {
    return null
  }
}

