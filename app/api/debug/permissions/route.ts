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

    // Lấy tất cả permissions để test
    const allPerms = await (prisma as any).permission.findMany({
      orderBy: { code: 'asc' }
    })

    // Test check permissions với tất cả quyền
    const permissionChecks: Record<string, any> = {}
    for (const perm of allPerms) {
      const hasPerm = await hasUserPermission(user.userId, user.role || '', perm.code, user.username)
      const checkResult = await checkPermission(user.userId, user.role || '', perm.code, user.username)
      permissionChecks[perm.code] = {
        hasUserPermission: hasPerm,
        checkPermission: checkResult
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
      allPermissions: allPerms.map((p: any) => ({
        code: p.code,
        name: p.name,
        category: p.category
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

