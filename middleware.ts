import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getJWT } from './lib/jwt'
import { PERMISSIONS } from './lib/permissions'
import { checkPermission } from './lib/check-permission'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Cho phép truy cập công khai:
  // - Trang login, register, init-admin, debug-db, debug-permissions
  // - Trang làm bài thi (public link)
  // - Tất cả API routes
  if (
    pathname === '/login' || 
    pathname === '/register' ||
    pathname === '/init-admin' || 
    pathname === '/debug-db' ||
    pathname === '/debug-permissions' ||
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
    console.log('[middleware] ========== /tasks CHECK ==========')
    console.log('[middleware] User info:', { userId: user.userId, username: user.username, role: user.role })
    if (user.role) {
      const { allowed, reason } = await checkPermission(user.userId, user.role, PERMISSIONS.VIEW_TASKS, user.username)
      console.log('[middleware] /tasks permission check result:', {
        userId: user.userId,
        username: user.username,
        role: user.role,
        allowed,
        reason
      })
      if (allowed) {
        console.log('[middleware] ✅ /tasks - Permission granted, allowing access')
        return NextResponse.next()
      } else {
        console.log('[middleware] ❌ /tasks - Permission denied, redirecting to /my-tasks')
      }
    } else {
      console.log('[middleware] ❌ /tasks - No role, redirecting to /my-tasks')
    }
    const url = request.nextUrl.clone()
    url.pathname = '/my-tasks'
    return NextResponse.redirect(url)
  }

  // Kiểm tra quyền truy cập /exams/create (tạo bài thi)
  if (pathname === '/exams/create') {
    if (user.role) {
      const { allowed } = await checkPermission(user.userId, user.role, PERMISSIONS.CREATE_EXAMS, user.username)
      if (allowed) {
        return NextResponse.next()
      }
    }
    const url = request.nextUrl.clone()
    url.pathname = '/exams'
    return NextResponse.redirect(url)
  }

  // Kiểm tra quyền truy cập /exams (quản lý bài thi)
  if (pathname === '/exams') {
    console.log('[middleware] ========== /exams CHECK ==========')
    console.log('[middleware] User info:', { userId: user.userId, username: user.username, role: user.role })
    if (user.role) {
      const { allowed, reason } = await checkPermission(user.userId, user.role, PERMISSIONS.VIEW_EXAMS, user.username)
      console.log('[middleware] /exams permission check result:', {
        userId: user.userId,
        username: user.username,
        role: user.role,
        allowed,
        reason
      })
      if (allowed) {
        console.log('[middleware] ✅ /exams - Permission granted, allowing access')
        return NextResponse.next()
      } else {
        console.log('[middleware] ❌ /exams - Permission denied, redirecting to /my-exams')
      }
    } else {
      console.log('[middleware] ❌ /exams - No role, redirecting to /my-exams')
    }
    const url = request.nextUrl.clone()
    url.pathname = '/my-exams'
    return NextResponse.redirect(url)
  }

  // Kiểm tra quyền truy cập /exams/[id]/edit (sửa bài thi)
  if (pathname.match(/^\/exams\/[^/]+\/edit$/)) {
    if (user.role) {
      const { allowed } = await checkPermission(user.userId, user.role, PERMISSIONS.EDIT_EXAMS, user.username)
      if (allowed) {
        return NextResponse.next()
      }
    }
    const url = request.nextUrl.clone()
    url.pathname = '/exams'
    return NextResponse.redirect(url)
  }

  // Kiểm tra quyền truy cập /questions (ngân hàng câu hỏi)
  if (pathname.startsWith('/questions')) {
    if (user.role) {
      const { allowed } = await checkPermission(user.userId, user.role, PERMISSIONS.VIEW_QUESTIONS, user.username)
      if (allowed) {
        return NextResponse.next()
      }
    }
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

