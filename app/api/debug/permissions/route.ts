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
    const user = await getJWT(request)
    
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    // Lấy thông tin user từ database (thử cả id và username)
    const dbUserById = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        username: true,
        role: true
      }
    })

    const dbUserByUsername = await prisma.user.findUnique({
      where: { username: user.username },
      select: {
        id: true,
        username: true,
        role: true
      }
    })

    // Lấy UserPermissions với cả 2 userId
    const userPermsByJwtId = await (prisma as any).userPermission.findMany({
      where: { userId: user.userId },
      include: {
        permission: true
      }
    })

    const userPermsByDbId = dbUserByUsername ? await (prisma as any).userPermission.findMany({
      where: { userId: dbUserByUsername.id },
      include: {
        permission: true
      }
    }) : []

    // Lấy TẤT CẢ UserPermissions để xem có userId nào khác không
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

    // Chỉ test các permissions quan trọng (không test tất cả để tránh timeout)
    const importantPerms = ['view_exams', 'create_exams', 'view_tasks', 'create_tasks', 'create_videos']
    
    // Test check permissions với các quyền quan trọng
    const permissionChecks: Record<string, any> = {}
    for (const permCode of importantPerms) {
      try {
        const hasPerm = await hasUserPermission(user.userId, user.role || '', permCode, user.username)
        const checkResult = await checkPermission(user.userId, user.role || '', permCode, user.username)
        permissionChecks[permCode] = {
          hasUserPermission: hasPerm,
          checkPermission: checkResult
        }
      } catch (err: any) {
        permissionChecks[permCode] = {
          hasUserPermission: false,
          checkPermission: { allowed: false, reason: `Error: ${err.message}` }
        }
      }
    }

    return NextResponse.json({
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
    })
  } catch (error: any) {
    console.error('[/api/debug/permissions] Error:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

