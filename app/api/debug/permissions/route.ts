import { NextRequest, NextResponse } from 'next/server'
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'
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

    // Lấy thông tin user từ database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        username: true,
        role: true
      }
    })

    // Lấy UserPermissions
    const userPerms = await prisma.userPermission.findMany({
      where: { userId: user.userId },
      include: {
        permission: true
      }
    })

    // Test check permissions
    const viewTasks = await hasUserPermission(user.userId, user.role, PERMISSIONS.VIEW_TASKS)
    const createTasks = await hasUserPermission(user.userId, user.role, PERMISSIONS.CREATE_TASKS)

    return NextResponse.json({
      jwt: {
        userId: user.userId,
        username: user.username,
        role: user.role
      },
      database: {
        user: dbUser,
        userPermissions: userPerms.map(up => ({
          code: up.permission.code,
          name: up.permission.name,
          type: up.type
        }))
      },
      checks: {
        view_tasks: viewTasks,
        create_tasks: createTasks
      }
    })
  } catch (error: any) {
    console.error('[/api/debug/permissions] Error:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

