import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getJWT } from './lib/jwt'
import { hasUserPermission, PERMISSIONS } from './lib/permissions'

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

  // Admin luôn được phép truy cập tất cả
  if (user.role === 'admin') {
    return NextResponse.next()
  }

  // Kiểm tra quyền truy cập /tasks
  if (pathname === '/tasks') {
    if (user.role) {
      const hasPermission = await hasUserPermission(user.userId, user.role, PERMISSIONS.VIEW_TASKS)
      console.log(`[Middleware] User ${user.username} (${user.role}) - VIEW_TASKS: ${hasPermission}`)
      if (hasPermission) {
        return NextResponse.next()
      }
    }
    // Không có quyền → redirect về /my-tasks
    console.log(`[Middleware] Redirecting ${user.username} to /my-tasks (no VIEW_TASKS permission)`)
    const url = request.nextUrl.clone()
    url.pathname = '/my-tasks'
    return NextResponse.redirect(url)
  }

  // Kiểm tra quyền truy cập /exams (quản lý bài thi)
  if (pathname === '/exams') {
    if (user.role && await hasUserPermission(user.userId, user.role, PERMISSIONS.VIEW_EXAMS)) {
      return NextResponse.next()
    }
    // Không có quyền → redirect về /my-exams
    const url = request.nextUrl.clone()
    url.pathname = '/my-exams'
    return NextResponse.redirect(url)
  }

  // Kiểm tra quyền truy cập /questions (ngân hàng câu hỏi)
  if (pathname.startsWith('/questions')) {
    if (user.role && await hasUserPermission(user.userId, user.role, PERMISSIONS.VIEW_QUESTIONS)) {
      return NextResponse.next()
    }
    // Không có quyền → redirect về trang chủ
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Cho phép tất cả user truy cập các trang cơ bản
  if (
    pathname.startsWith('/videos') || 
    pathname.startsWith('/documents') || 
    pathname === '/' || 
    pathname === '/settings' ||
    pathname === '/my-exams' ||
    pathname === '/my-tasks' ||
    pathname.match(/^\/exams\/[^/]+\/take$/) || 
    pathname.match(/^\/exams\/[^/]+\/result$/) || 
    pathname.match(/^\/exams\/[^/]+\/results$/)
  ) {
    return NextResponse.next()
  }

  // Nếu không match điều kiện nào, redirect về videos
  const url = request.nextUrl.clone()
  url.pathname = '/videos'
  return NextResponse.redirect(url)
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

