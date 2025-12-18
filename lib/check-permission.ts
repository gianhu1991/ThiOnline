import { prisma } from './prisma'
import { PERMISSIONS } from './permissions'

/**
 * Helper function để lấy userId đúng từ database (dựa trên userId hoặc username)
 */
async function getCorrectUserId(userId: string, username?: string): Promise<string | null> {
  try {
    // Thử tìm user bằng userId
    const userById = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    })
    
    if (userById) {
      console.log('[getCorrectUserId] Found by userId:', { inputUserId: userId, foundUserId: userById.id, foundUsername: userById.username })
      return userById.id
    }
    
    // Nếu không tìm thấy, thử tìm bằng username
    if (username) {
      const userByUsername = await prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true }
      })
      
      if (userByUsername) {
        console.log('[getCorrectUserId] Found by username:', { inputUserId: userId, inputUsername: username, foundUserId: userByUsername.id, foundUsername: userByUsername.username })
        return userByUsername.id
      } else {
        console.log('[getCorrectUserId] User not found by username:', { inputUserId: userId, inputUsername: username })
      }
    }
    
    console.log('[getCorrectUserId] User not found:', { inputUserId: userId, inputUsername: username })
    return null
  } catch (error) {
    console.error('[getCorrectUserId] Error:', error)
    return null
  }
}

/**
 * Helper function để check permission - dùng chung cho middleware và API routes
 * Returns: { allowed: boolean, reason?: string }
 */
export async function checkPermission(
  userId: string,
  role: string,
  permissionCode: string,
  username?: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Admin luôn được phép
    if (role === 'admin') {
      return { allowed: true }
    }

    if (!role) {
      return { allowed: false, reason: 'No role' }
    }

    // Lấy userId đúng từ database
    const correctUserId = await getCorrectUserId(userId, username)
    if (!correctUserId) {
      return { allowed: false, reason: 'User not found' }
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
          userId: correctUserId,
          permissionId: permission.id
        }
      }
    })

    // Debug logging - luôn log cho các permission quan trọng
    if (permissionCode === 'view_tasks' || permissionCode === 'create_tasks' || permissionCode === 'view_exams' || permissionCode === 'create_exams' || permissionCode === 'create_videos') {
      // Tìm tất cả UserPermission của user này để debug
      const allUserPerms = await prisma.userPermission.findMany({
        where: { userId: correctUserId },
        include: { permission: true }
      })
      
      console.log('[checkPermission] Debug:', {
        originalUserId: userId,
        correctUserId,
        username,
        role,
        permissionCode,
        permissionId: permission.id,
        userPerm: userPerm ? { type: userPerm.type, userId: userPerm.userId } : null,
        allUserPerms: allUserPerms.map(up => ({ code: up.permission.code, type: up.type, userId: up.userId }))
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

