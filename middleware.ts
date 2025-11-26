import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getJWT } from './lib/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Cho phép truy cập trang login và tất cả API routes
  if (pathname === '/login' || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Kiểm tra authentication cho các trang khác
  const user = await getJWT(request)

  if (!user) {
    // Redirect về trang login nếu chưa đăng nhập
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

