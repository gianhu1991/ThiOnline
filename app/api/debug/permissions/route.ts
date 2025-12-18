import { NextRequest, NextResponse } from 'next/server'
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'
import { checkPermission } from '@/lib/check-permission'
import { prisma } from '@/lib/prisma'

/**
 * API debug để kiểm tra permissions của user
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] Starting /api/debug/permissions...')
    const user = await getJWT(request)
    
    if (!user || !user.role) {
      console.log('[DEBUG] No user or role')
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    console.log('[DEBUG] User from JWT:', { userId: user.userId, username: user.username, role: user.role })

    // Lấy thông tin user từ database (thử cả id và username)
    console.log('[DEBUG] Fetching user by ID...')
    const dbUserById = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        username: true,
        role: true
      }
    })
    console.log('[DEBUG] User by ID:', dbUserById)

    console.log('[DEBUG] Fetching user by username...')
    const dbUserByUsername = await prisma.user.findUnique({
      where: { username: user.username },
      select: {
        id: true,
        username: true,
        role: true
      }
    })
    console.log('[DEBUG] User by username:', dbUserByUsername)

    // Lấy UserPermissions với cả 2 userId
    console.log('[DEBUG] Fetching user permissions by JWT userId...')
    const userPermsByJwtId = await (prisma as any).userPermission.findMany({
      where: { userId: user.userId },
      include: {
        permission: true
      }
    })
    console.log('[DEBUG] User permissions by JWT userId:', userPermsByJwtId.length)

    console.log('[DEBUG] Fetching user permissions by DB userId...')
    const userPermsByDbId = dbUserByUsername ? await (prisma as any).userPermission.findMany({
      where: { userId: dbUserByUsername.id },
      include: {
        permission: true
      }
    }) : []
    console.log('[DEBUG] User permissions by DB userId:', userPermsByDbId.length)

    // Lấy TẤT CẢ UserPermissions để xem có userId nào khác không
    console.log('[DEBUG] Fetching all user permissions for gianhu1991...')
    const allUserPerms = await (prisma as any).userPermission.findMany({
      where: {
        permission: {
          code: { in: ['view_exams', 'create_exams', 'view_tasks', 'create_tasks', 'create_videos'] }
        }
      },
      include: {
        permission: true,
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })
    console.log('[DEBUG] All user permissions found:', allUserPerms.length)

    // Chỉ test các permissions quan trọng (không test tất cả để tránh timeout)
    const importantPerms = ['view_exams', 'create_exams', 'view_tasks', 'create_tasks', 'create_videos']
    
    // Test check permissions với các quyền quan trọng
    console.log('[DEBUG] Testing permissions...')
    const permissionChecks: Record<string, any> = {}
    for (const permCode of importantPerms) {
      try {
        console.log(`[DEBUG] Checking ${permCode}...`)
        const hasPerm = await hasUserPermission(user.userId, user.role || '', permCode, user.username)
        const checkResult = await checkPermission(user.userId, user.role || '', permCode, user.username)
        permissionChecks[permCode] = {
          hasUserPermission: hasPerm,
          checkPermission: checkResult
        }
        console.log(`[DEBUG] ${permCode}: hasPerm=${hasPerm}, allowed=${checkResult.allowed}`)
      } catch (err: any) {
        console.error(`[DEBUG] Error checking ${permCode}:`, err)
        permissionChecks[permCode] = {
          hasUserPermission: false,
          checkPermission: { allowed: false, reason: `Error: ${err.message}` }
        }
      }
    }
    console.log('[DEBUG] Permission checks completed')

    console.log('[DEBUG] Preparing response...')
    const response = {
      jwt: {
        userId: user.userId,
        username: user.username,
        role: user.role
      },
      database: {
        userById: dbUserById,
        userByUsername: dbUserByUsername,
        userIdMatch: dbUserById?.id === user.userId,
        usernameMatch: dbUserByUsername?.username === user.username
      },
      userPermissions: {
        byJwtUserId: userPermsByJwtId.map((up: any) => ({
          code: up.permission.code,
          name: up.permission.name,
          type: up.type,
          userId: up.userId
        })),
        byDbUserId: userPermsByDbId.map((up: any) => ({
          code: up.permission.code,
          name: up.permission.name,
          type: up.type,
          userId: up.userId
        }))
      },
      allUserPermissionsForGianhu1991: allUserPerms
        .filter((up: any) => up.user.username === 'gianhu1991')
        .map((up: any) => ({
          code: up.permission.code,
          name: up.permission.name,
          type: up.type,
          userId: up.userId,
          userUsername: up.user.username
        })),
      permissionChecks
    }
    console.log('[DEBUG] Sending response...')
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[/api/debug/permissions] Error:', error)
    console.error('[/api/debug/permissions] Error stack:', error.stack)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

