import { prisma } from './prisma'
import { PERMISSIONS } from './permissions'

/**
 * Helper function để lấy userId đúng từ database (BẮT BUỘC dùng username, không dùng userId từ JWT)
 */
async function getCorrectUserId(userId: string, username?: string): Promise<string | null> {
  try {
    // BẮT BUỘC: Phải có username, không thì return null
    if (!username) {
      console.error('[getCorrectUserId] ❌ Username không tồn tại!', { userId })
      return null
    }

    // Tìm user bằng username (đáng tin cậy nhất)
    console.log('[getCorrectUserId] 🔍 Looking up user by username:', username)
    const userByUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true }
    })
    
    if (userByUsername) {
      // Log warning nếu userId không match
      if (userByUsername.id !== userId) {
        console.warn('[getCorrectUserId] ⚠️ userId mismatch:', {
          jwtUserId: userId,
          correctUserId: userByUsername.id,
          username,
          willUse: userByUsername.id
        })
      } else {
        console.log('[getCorrectUserId] ✅ userId match:', { userId, username })
      }
      return userByUsername.id
    }
    
    console.error('[getCorrectUserId] ❌ User not found by username:', { username, jwtUserId: userId })
    return null
  } catch (error) {
    console.error('[getCorrectUserId] ❌ Error:', error)
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
    // Admin và Leader luôn được phép
    if (role === 'admin' || role === 'leader') {
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
    console.log('[checkPermission] 🔍 Checking UserPermission:', {
      correctUserId,
      permissionId: permission.id,
      permissionCode
    })
    const userPerm = await prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId: correctUserId,
          permissionId: permission.id
        }
      }
    })
    console.log('[checkPermission] 📊 UserPermission result:', userPerm ? {
      type: userPerm.type,
      userId: userPerm.userId,
      permissionId: userPerm.permissionId
    } : 'NOT FOUND')

    // Debug logging - luôn log cho các permission quan trọng
    if (permissionCode === 'view_tasks' || permissionCode === 'create_tasks' || permissionCode === 'view_exams' || permissionCode === 'create_exams' || permissionCode === 'create_videos') {
      // Tìm tất cả UserPermission của user này để debug
      const allUserPerms = await prisma.userPermission.findMany({
        where: { userId: correctUserId },
        include: { permission: true }
      })
      
      console.log('[checkPermission] 🔍 All UserPermissions for this user:', {
        correctUserId,
        username,
        count: allUserPerms.length,
        permissions: allUserPerms.map(up => ({ 
          code: up.permission.code, 
          type: up.type, 
          userId: up.userId 
        }))
      })
    }

    // DENY có ưu tiên cao nhất - từ chối luôn
    if (userPerm && userPerm.type === 'deny') {
      console.log('[checkPermission] ❌ DENY - User permission denied')
      return { allowed: false, reason: 'User permission denied' }
    }

    // GRANT cho phép luôn - bỏ qua role permission
    if (userPerm && userPerm.type === 'grant') {
      console.log('[checkPermission] ✅ GRANT - User permission granted')
      return { allowed: true }
    }

    // Nếu không có UserPermission, check RolePermission
    console.log('[checkPermission] 🔍 Checking RolePermission:', { role, permissionId: permission.id })
    const rolePerm = await prisma.rolePermission.findFirst({
      where: {
        role,
        permissionId: permission.id
      }
    })

    if (rolePerm) {
      console.log('[checkPermission] ✅ RolePermission found - allowed')
      return { allowed: true }
    }

    console.log('[checkPermission] ❌ No permission found')
    return { allowed: false, reason: 'No permission' }
  } catch (error: any) {
    console.error('[checkPermission] Error:', error)
    // Nếu có lỗi (ví dụ: bảng chưa tồn tại), fallback về false để an toàn
    return { allowed: false, reason: `Error: ${error.message}` }
  }
}

