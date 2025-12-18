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

    if (!role) {
      return { allowed: false, reason: 'No role' }
    }

    // Lấy permission từ database
    const permission = await prisma.permission.findUnique({
      where: { code: permissionCode }
    })

    if (!permission) {
      // Nếu permission không tồn tại, có thể bảng chưa được tạo
      // Fallback về false để an toàn
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

    // Debug logging
    if (permissionCode === 'view_tasks' || permissionCode === 'create_tasks') {
      console.log('[checkPermission] Debug:', {
        userId,
        role,
        permissionCode,
        permissionId: permission.id,
        userPerm: userPerm ? { type: userPerm.type, userId: userPerm.userId } : null
      })
    }

    // DENY có ưu tiên cao nhất - từ chối luôn
    if (userPerm && userPerm.type === 'deny') {
      return { allowed: false, reason: 'User permission denied' }
    }

    // GRANT cho phép luôn - bỏ qua role permission
    if (userPerm && userPerm.type === 'grant') {
      return { allowed: true }
    }

    // Nếu không có UserPermission, check RolePermission
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
  } catch (error: any) {
    console.error('[checkPermission] Error:', error)
    // Nếu có lỗi (ví dụ: bảng chưa tồn tại), fallback về false để an toàn
    return { allowed: false, reason: `Error: ${error.message}` }
  }
}

