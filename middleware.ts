import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getJWT } from './lib/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Cho phép truy cập công khai:
  // - Trang login, register, init-admin, debug-db
  // - Trang làm bài thi (public link)
  // - Tất cả API routes
  if (
    pathname === '/login' || 
    pathname === '/register' ||
    pathname === '/init-admin' || 
    pathname === '/debug-db' || 
    pathname.startsWith('/api/') ||
    pathname.match(/^\/exams\/[^/]+\/take$/) || // /exams/[id]/take
    pathname.match(/^\/exams\/[^/]+\/result$/) // /exams/[id]/result
  ) {
    return NextResponse.next()
  }

  // Kiểm tra authentication cho các trang khác (bao gồm trang chủ)
  const user = await getJWT(request)

  if (!user) {
    // Redirect về trang login nếu chưa đăng nhập
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Nếu là user thường (không phải admin), chỉ cho phép truy cập videos và documents
  if (user.role !== 'admin') {
    // Chỉ cho phép truy cập /videos, /documents và các trang con của chúng
    if (pathname.startsWith('/videos') || pathname.startsWith('/documents')) {
      return NextResponse.next()
    }
    // Tất cả các trang khác (bao gồm trang chủ) redirect về /videos
    const url = request.nextUrl.clone()
    url.pathname = '/videos'
    return NextResponse.redirect(url)
  }

  // Kiểm tra quyền admin cho các trang quản lý
  if (pathname.startsWith('/questions') ||
      pathname.startsWith('/exams/create') ||
      pathname.startsWith('/exams/') && pathname.includes('/edit') ||
      pathname.startsWith('/settings')) {
    if (user.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
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

