import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getJWT } from './lib/jwt'
import { PERMISSIONS } from './lib/permissions'

/**
 * Helper function để check permission từ middleware (Edge Runtime)
 * Gọi API route thay vì dùng Prisma trực tiếp
 */
async function checkPermissionViaAPI(
  request: NextRequest,
  permissionCode: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const checkUrl = new URL('/api/auth/check-permission', request.url)
    checkUrl.searchParams.set('permission', permissionCode)
    
    const checkRequest = new Request(checkUrl.toString(), {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      }
    })
    
    const checkResponse = await fetch(checkRequest)
    const checkResult = await checkResponse.json()
    
    return {
      allowed: checkResult.allowed || false,
      reason: checkResult.reason
    }
  } catch (error: any) {
    console.error('[middleware] Error checking permission via API:', error)
    return { allowed: false, reason: `Error: ${error.message}` }
  }
}

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

  // Kiểm tra quyền truy cập /tasks
  if (pathname === '/tasks') {
    // Admin và Leader luôn được phép
    if (user.role === 'admin' || user.role === 'leader') {
      console.log('[middleware] ✅ /tasks - Admin/Leader, allowing access')
      return NextResponse.next()
    }
    console.log('[middleware] ========== /tasks CHECK ==========')
    console.log('[middleware] User info:', { userId: user.userId, username: user.username, role: user.role })
    
    // BẮT BUỘC: Phải có username để check permission đúng
    if (!user.username) {
      console.error('[middleware] ❌ /tasks - No username in JWT, redirecting to /my-tasks')
      const url = request.nextUrl.clone()
      url.pathname = '/my-tasks'
      return NextResponse.redirect(url)
    }
    
    if (user.role) {
      const { allowed, reason } = await checkPermissionViaAPI(request, PERMISSIONS.VIEW_TASKS)
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
        // Nếu lỗi là "User not found" hoặc "Permission not found", có thể là lỗi tạm thời
        // Trong trường hợp này, vẫn redirect để tránh lỗi, nhưng log chi tiết
        if (reason === 'User not found' || reason === 'Permission not found' || reason?.includes('Error:')) {
          console.error('[middleware] ⚠️ /tasks - Permission check error:', reason, '- This might be a temporary issue')
        }
        console.log('[middleware] ❌ /tasks - Permission denied, redirecting to /my-tasks. Reason:', reason)
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
    // Admin luôn được phép
    if (user.role === 'admin') {
      return NextResponse.next()
    }
    
    if (user.role) {
      const { allowed } = await checkPermissionViaAPI(request, PERMISSIONS.CREATE_EXAMS)
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
    
    // Admin và Leader luôn được phép - BỎ QUA TẤT CẢ CHECK
    if (user.role === 'admin' || user.role === 'leader') {
      console.log('[middleware] ✅ /exams - Admin/Leader, allowing access (bypassing all checks)')
      return NextResponse.next()
    }
    
    // BẮT BUỘC: Phải có username để check permission đúng
    if (!user.username) {
      console.error('[middleware] ❌ /exams - No username in JWT, redirecting to /my-exams')
      const url = request.nextUrl.clone()
      url.pathname = '/my-exams'
      return NextResponse.redirect(url)
    }
    
    if (!user.role) {
      console.log('[middleware] ❌ /exams - No role, redirecting to /my-exams')
      const url = request.nextUrl.clone()
      url.pathname = '/my-exams'
      return NextResponse.redirect(url)
    }
    
    // Check permission bằng cách gọi API route (vì middleware chạy trên Edge Runtime, không thể dùng Prisma)
    console.log('[middleware] 🔍 Checking permission VIEW_EXAMS for user:', {
      userId: user.userId,
      username: user.username,
      role: user.role
    })
    
    try {
      // Gọi API route để check permission
      const checkUrl = new URL('/api/auth/check-permission', request.url)
      checkUrl.searchParams.set('permission', PERMISSIONS.VIEW_EXAMS)
      
      // Tạo request mới với cookies từ request gốc
      const checkRequest = new Request(checkUrl.toString(), {
        method: 'GET',
        headers: {
          'Cookie': request.headers.get('cookie') || '',
        }
      })
      
      const checkResponse = await fetch(checkRequest)
      const checkResult = await checkResponse.json()
      
      console.log('[middleware] 📊 /exams permission check result:', {
        userId: user.userId,
        username: user.username,
        role: user.role,
        permission: PERMISSIONS.VIEW_EXAMS,
        allowed: checkResult.allowed,
        reason: checkResult.reason
      })
      
      if (checkResult.allowed) {
        console.log('[middleware] ✅ /exams - Permission granted, allowing access')
        return NextResponse.next()
      } else {
        // Log chi tiết lý do từ chối
        console.error('[middleware] ❌ /exams - Permission DENIED:', {
          reason: checkResult.reason,
          userId: user.userId,
          username: user.username,
          role: user.role,
          permission: PERMISSIONS.VIEW_EXAMS
        })
        
        // Nếu lỗi là "User not found" hoặc "Permission not found", có thể là lỗi tạm thời
        if (checkResult.reason === 'User not found' || checkResult.reason === 'Permission not found' || checkResult.reason?.includes('Error:')) {
          console.error('[middleware] ⚠️ /exams - Permission check error:', checkResult.reason, '- This might be a temporary issue')
        }
        
        const url = request.nextUrl.clone()
        url.pathname = '/my-exams'
        return NextResponse.redirect(url)
      }
    } catch (error: any) {
      console.error('[middleware] ❌ Error checking permission:', error)
      // Nếu có lỗi khi check permission, redirect để an toàn
      const url = request.nextUrl.clone()
      url.pathname = '/my-exams'
      return NextResponse.redirect(url)
    }
  }

  // Kiểm tra quyền truy cập /exams/[id]/edit (sửa bài thi)
  if (pathname.match(/^\/exams\/[^/]+\/edit$/)) {
    // Admin luôn được phép
    if (user.role === 'admin') {
      return NextResponse.next()
    }
    
    if (user.role) {
      const { allowed } = await checkPermissionViaAPI(request, PERMISSIONS.EDIT_EXAMS)
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
    // Admin luôn được phép
    if (user.role === 'admin') {
      return NextResponse.next()
    }
    
    if (user.role) {
      const { allowed } = await checkPermissionViaAPI(request, PERMISSIONS.VIEW_QUESTIONS)
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

