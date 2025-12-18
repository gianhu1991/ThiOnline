import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getJWT } from './lib/jwt'
import { PERMISSIONS } from './lib/permissions'
import { prisma } from './lib/prisma'

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
    // Admin luôn được phép (đã check ở trên)
    if (user.role === 'admin') {
      return NextResponse.next()
    }
    
    if (user.role) {
      try {
        // Check permissions giống như API /api/auth/permissions
        const permission = await prisma.permission.findUnique({
          where: { code: PERMISSIONS.VIEW_TASKS }
        })
        
        if (permission) {
          // Check UserPermission
          const userPerm = await prisma.userPermission.findUnique({
            where: {
              userId_permissionId: {
                userId: user.userId,
                permissionId: permission.id
              }
            }
          })
          
          // Nếu có grant, cho phép
          if (userPerm && userPerm.type === 'grant') {
            return NextResponse.next()
          }
          
          // Nếu có deny, từ chối
          if (userPerm && userPerm.type === 'deny') {
            const url = request.nextUrl.clone()
            url.pathname = '/my-tasks'
            return NextResponse.redirect(url)
          }
          
          // Check RolePermission
          const rolePerm = await prisma.rolePermission.findFirst({
            where: {
              role: user.role,
              permissionId: permission.id
            }
          })
          
          if (rolePerm) {
            return NextResponse.next()
          }
        }
      } catch (error) {
        console.error(`[Middleware] Error checking permission for ${user.username}:`, error)
        // Nếu có lỗi, cho phép vào (fallback) - frontend sẽ check lại
        return NextResponse.next()
      }
    }
    // Không có quyền → redirect về /my-tasks
    const url = request.nextUrl.clone()
    url.pathname = '/my-tasks'
    return NextResponse.redirect(url)
  }

  // Kiểm tra quyền truy cập /exams/create (tạo bài thi)
  if (pathname === '/exams/create') {
    if (user.role === 'admin') {
      return NextResponse.next()
    }
    
    if (user.role) {
      try {
        const permission = await prisma.permission.findUnique({
          where: { code: PERMISSIONS.CREATE_EXAMS }
        })
        
        if (permission) {
          const userPerm = await prisma.userPermission.findUnique({
            where: {
              userId_permissionId: {
                userId: user.userId,
                permissionId: permission.id
              }
            }
          })
          
          if (userPerm && userPerm.type === 'grant') {
            return NextResponse.next()
          }
          
          if (userPerm && userPerm.type === 'deny') {
            const url = request.nextUrl.clone()
            url.pathname = '/exams'
            return NextResponse.redirect(url)
          }
          
          const rolePerm = await prisma.rolePermission.findFirst({
            where: {
              role: user.role,
              permissionId: permission.id
            }
          })
          
          if (rolePerm) {
            return NextResponse.next()
          }
        }
      } catch (error) {
        console.error(`[Middleware] Error checking CREATE_EXAMS:`, error)
        return NextResponse.next()
      }
    }
    
    const url = request.nextUrl.clone()
    url.pathname = '/exams'
    return NextResponse.redirect(url)
  }

  // Kiểm tra quyền truy cập /exams (quản lý bài thi)
  if (pathname === '/exams') {
    if (user.role === 'admin') {
      return NextResponse.next()
    }
    
    if (user.role) {
      try {
        const permission = await prisma.permission.findUnique({
          where: { code: PERMISSIONS.VIEW_EXAMS }
        })
        
        if (permission) {
          const userPerm = await prisma.userPermission.findUnique({
            where: {
              userId_permissionId: {
                userId: user.userId,
                permissionId: permission.id
              }
            }
          })
          
          if (userPerm && userPerm.type === 'grant') {
            return NextResponse.next()
          }
          
          if (userPerm && userPerm.type === 'deny') {
            const url = request.nextUrl.clone()
            url.pathname = '/my-exams'
            return NextResponse.redirect(url)
          }
          
          const rolePerm = await prisma.rolePermission.findFirst({
            where: {
              role: user.role,
              permissionId: permission.id
            }
          })
          
          if (rolePerm) {
            return NextResponse.next()
          }
        }
      } catch (error) {
        console.error(`[Middleware] Error checking VIEW_EXAMS:`, error)
        return NextResponse.next()
      }
    }
    
    const url = request.nextUrl.clone()
    url.pathname = '/my-exams'
    return NextResponse.redirect(url)
  }

  // Kiểm tra quyền truy cập /questions (ngân hàng câu hỏi)
  if (pathname.startsWith('/questions')) {
    if (user.role === 'admin') {
      return NextResponse.next()
    }
    
    if (user.role) {
      try {
        const permission = await prisma.permission.findUnique({
          where: { code: PERMISSIONS.VIEW_QUESTIONS }
        })
        
        if (permission) {
          const userPerm = await prisma.userPermission.findUnique({
            where: {
              userId_permissionId: {
                userId: user.userId,
                permissionId: permission.id
              }
            }
          })
          
          if (userPerm && userPerm.type === 'grant') {
            return NextResponse.next()
          }
          
          if (userPerm && userPerm.type === 'deny') {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
          }
          
          const rolePerm = await prisma.rolePermission.findFirst({
            where: {
              role: user.role,
              permissionId: permission.id
            }
          })
          
          if (rolePerm) {
            return NextResponse.next()
          }
        }
      } catch (error) {
        console.error(`[Middleware] Error checking VIEW_QUESTIONS:`, error)
        return NextResponse.next()
      }
    }
    
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Kiểm tra quyền truy cập /exams/[id]/edit (sửa bài thi)
  if (pathname.match(/^\/exams\/[^/]+\/edit$/)) {
    if (user.role === 'admin') {
      return NextResponse.next()
    }
    
    if (user.role) {
      try {
        const permission = await prisma.permission.findUnique({
          where: { code: PERMISSIONS.EDIT_EXAMS }
        })
        
        if (permission) {
          const userPerm = await prisma.userPermission.findUnique({
            where: {
              userId_permissionId: {
                userId: user.userId,
                permissionId: permission.id
              }
            }
          })
          
          if (userPerm && userPerm.type === 'grant') {
            return NextResponse.next()
          }
          
          if (userPerm && userPerm.type === 'deny') {
            const url = request.nextUrl.clone()
            url.pathname = '/exams'
            return NextResponse.redirect(url)
          }
          
          const rolePerm = await prisma.rolePermission.findFirst({
            where: {
              role: user.role,
              permissionId: permission.id
            }
          })
          
          if (rolePerm) {
            return NextResponse.next()
          }
        }
      } catch (error) {
        console.error(`[Middleware] Error checking EDIT_EXAMS:`, error)
        return NextResponse.next()
      }
    }
    
    const url = request.nextUrl.clone()
    url.pathname = '/exams'
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

