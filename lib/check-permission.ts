import { prisma } from './prisma'
import { PERMISSIONS } from './permissions'

/**
 * Helper function để check permission - dùng chung cho middleware và API routes
 * Returns: { allowed: boolean, reason?: string }
 */
export async function checkPermission(
  userId: string,
  role: string,
  permissionCode: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Admin luôn được phép
    if (role === 'admin') {
      return { allowed: true }
    }

    // Lấy permission từ database
    const permission = await prisma.permission.findUnique({
      where: { code: permissionCode }
    })

    if (!permission) {
      return { allowed: false, reason: 'Permission not found' }
    }

    // Check UserPermission (ưu tiên cao nhất)
    const userPerm = await prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id
        }
      }
    })

    // DENY có ưu tiên cao nhất
    if (userPerm && userPerm.type === 'deny') {
      return { allowed: false, reason: 'User permission denied' }
    }

    // GRANT cho phép luôn
    if (userPerm && userPerm.type === 'grant') {
      return { allowed: true }
    }

    // Check RolePermission
    const rolePerm = await prisma.rolePermission.findFirst({
      where: {
        role,
        permissionId: permission.id
      }
    })

    if (rolePerm) {
      return { allowed: true }
    }

    return { allowed: false, reason: 'No permission' }
  } catch (error) {
    console.error('[checkPermission] Error:', error)
    // Nếu có lỗi, fallback về false để an toàn
    return { allowed: false, reason: 'Error checking permission' }
  }
}

