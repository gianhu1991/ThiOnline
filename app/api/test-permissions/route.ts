import { NextRequest, NextResponse } from 'next/server'
import { getJWT } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

/**
 * API test đơn giản để kiểm tra permissions
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    // Tìm userId đúng từ database
    const dbUser = await prisma.user.findUnique({
      where: { username: user.username },
      select: { id: true, username: true, role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Lấy UserPermissions với cả 2 userId
    const userPermsByJwtId = await prisma.userPermission.findMany({
      where: { userId: user.userId },
      include: { permission: true }
    })

    const userPermsByDbId = await prisma.userPermission.findMany({
      where: { userId: dbUser.id },
      include: { permission: true }
    })

    // Test check permission
    const permission = await prisma.permission.findUnique({
      where: { code: 'view_tasks' }
    })

    let userPermByJwtId = null
    let userPermByDbId = null

    if (permission) {
      userPermByJwtId = await prisma.userPermission.findUnique({
        where: {
          userId_permissionId: {
            userId: user.userId,
            permissionId: permission.id
          }
        }
      })

      userPermByDbId = await prisma.userPermission.findUnique({
        where: {
          userId_permissionId: {
            userId: dbUser.id,
            permissionId: permission.id
          }
        }
      })
    }

    return NextResponse.json({
      jwt: {
        userId: user.userId,
        username: user.username,
        role: user.role
      },
      database: {
        userId: dbUser.id,
        username: dbUser.username,
        role: dbUser.role,
        userIdMatch: user.userId === dbUser.id
      },
      userPermissions: {
        byJwtUserId: {
          count: userPermsByJwtId.length,
          permissions: userPermsByJwtId.map(up => ({
            code: up.permission.code,
            type: up.type,
            userId: up.userId
          }))
        },
        byDbUserId: {
          count: userPermsByDbId.length,
          permissions: userPermsByDbId.map(up => ({
            code: up.permission.code,
            type: up.type,
            userId: up.userId
          }))
        }
      },
      viewTasksPermission: {
        permissionId: permission?.id,
        userPermByJwtId: userPermByJwtId ? {
          type: userPermByJwtId.type,
          userId: userPermByJwtId.userId
        } : null,
        userPermByDbId: userPermByDbId ? {
          type: userPermByDbId.type,
          userId: userPermByDbId.userId
        } : null
      }
    })
  } catch (error: any) {
    console.error('[/api/test-permissions] Error:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

