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

  // Nếu là user thường (không phải admin), chỉ cho phép truy cập videos, documents, trang chủ, settings và my-exams
  if (user.role !== 'admin') {
    // Cho phép truy cập /videos, /documents, trang chủ (/), settings và my-exams
    if (
      pathname.startsWith('/videos') || 
      pathname.startsWith('/documents') || 
      pathname === '/' || 
      pathname === '/settings' ||
      pathname === '/my-exams' ||
      pathname.match(/^\/exams\/[^/]+\/take$/) || // Cho phép làm bài thi
      pathname.match(/^\/exams\/[^/]+\/result$/) || // Cho phép xem kết quả
      pathname.match(/^\/exams\/[^/]+\/results$/) // Cho phép xem danh sách kết quả
    ) {
      return NextResponse.next()
    }
    // Tất cả các trang khác redirect về /videos (trừ /exams - chỉ admin mới được)
    if (pathname.startsWith('/exams')) {
      // Nếu user thường cố truy cập /exams (quản lý), redirect về /my-exams
      const url = request.nextUrl.clone()
      url.pathname = '/my-exams'
      return NextResponse.redirect(url)
    }
    // Tất cả các trang khác redirect về /videos
    const url = request.nextUrl.clone()
    url.pathname = '/videos'
    return NextResponse.redirect(url)
  }

  // Kiểm tra quyền admin cho các trang quản lý (trừ /settings - cho phép cả user thường)
  if (pathname.startsWith('/questions') ||
      pathname.startsWith('/exams/create') ||
      pathname.startsWith('/exams/') && pathname.includes('/edit')) {
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

