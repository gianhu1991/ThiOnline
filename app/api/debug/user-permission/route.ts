import { NextRequest, NextResponse } from 'next/server'
import { getJWT } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { checkPermission } from '@/lib/check-permission'
import { PERMISSIONS } from '@/lib/permissions'

/**
 * API debug để kiểm tra chi tiết permission của user cụ thể
 * Usage: GET /api/debug/user-permission?username=gianhu1991&permission=view_exams
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username') || 'gianhu1991'
    const permissionCode = searchParams.get('permission') || 'view_exams'

    console.log('[DEBUG] Checking permission for:', { username, permissionCode })

    // 1. Tìm user trong database
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        username 
      }, { status: 404 })
    }

    console.log('[DEBUG] User found:', user)

    // 2. Tìm permission trong database
    const permission = await prisma.permission.findUnique({
      where: { code: permissionCode }
    })

    if (!permission) {
      return NextResponse.json({ 
        error: 'Permission not found',
        permissionCode,
        suggestion: 'Có thể permission chưa được tạo trong database. Hãy chạy migration SQL.'
      }, { status: 404 })
    }

    console.log('[DEBUG] Permission found:', permission)

    // 3. Kiểm tra UserPermission (đặc cách)
    const userPermission = await prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId: user.id,
          permissionId: permission.id
        }
      },
      include: {
        permission: true
      }
    })

    console.log('[DEBUG] UserPermission:', userPermission)

    // 4. Kiểm tra RolePermission (quyền mặc định của role)
    const rolePermission = await prisma.rolePermission.findFirst({
      where: {
        role: user.role,
        permissionId: permission.id
      },
      include: {
        permission: true
      }
    })

    console.log('[DEBUG] RolePermission:', rolePermission)

    // 5. Test checkPermission function
    const checkResult = await checkPermission(user.id, user.role, permissionCode, user.username)
    console.log('[DEBUG] checkPermission result:', checkResult)

    // 6. Lấy tất cả UserPermissions của user này để xem tổng quan
    const allUserPermissions = await prisma.userPermission.findMany({
      where: { userId: user.id },
      include: { permission: true }
    })

    // 7. Lấy tất cả RolePermissions của role này
    const allRolePermissions = await prisma.rolePermission.findMany({
      where: { role: user.role },
      include: { permission: true }
    })

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      permission: {
        id: permission.id,
        code: permission.code,
        name: permission.name,
        category: permission.category
      },
      userPermission: userPermission ? {
        type: userPermission.type,
        grantedBy: userPermission.grantedBy,
        reason: userPermission.reason,
        createdAt: userPermission.createdAt
      } : null,
      rolePermission: rolePermission ? {
        role: rolePermission.role,
        createdAt: rolePermission.createdAt
      } : null,
      checkPermissionResult: checkResult,
      summary: {
        hasUserPermission: !!userPermission && userPermission.type === 'grant',
        hasUserDeny: !!userPermission && userPermission.type === 'deny',
        hasRolePermission: !!rolePermission,
        finalResult: checkResult.allowed,
        reason: checkResult.reason
      },
      allUserPermissions: allUserPermissions.map(up => ({
        code: up.permission.code,
        name: up.permission.name,
        type: up.type
      })),
      allRolePermissions: allRolePermissions.map(rp => ({
        code: rp.permission.code,
        name: rp.permission.name
      }))
    })
  } catch (error: any) {
    console.error('[DEBUG] Error:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

