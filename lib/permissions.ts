import { prisma } from './prisma'

// Cache permissions trong memory để tránh query database liên tục
let permissionsCache: Map<string, Set<string>> = new Map()
let cacheTimestamp: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 phút

/**
 * Load tất cả permissions của các roles vào cache
 */
async function loadPermissionsCache() {
  const now = Date.now()
  
  // Nếu cache còn hiệu lực, không cần load lại
  if (now - cacheTimestamp < CACHE_TTL && permissionsCache.size > 0) {
    return
  }

  try {
    // Lấy tất cả rolePermissions
    const rolePermissions = await prisma.rolePermission.findMany({
      include: {
        permission: true
      }
    })

    // Reset cache
    permissionsCache = new Map()

    // Nhóm permissions theo role
    rolePermissions.forEach(rp => {
      if (!permissionsCache.has(rp.role)) {
        permissionsCache.set(rp.role, new Set())
      }
      permissionsCache.get(rp.role)!.add(rp.permission.code)
    })

    cacheTimestamp = now
  } catch (error) {
    console.error('[Permissions] Lỗi khi load cache:', error)
    // Nếu lỗi (ví dụ: chưa có bảng), trả về cache rỗng
  }
}

/**
 * Kiểm tra xem một role có quyền cụ thể không
 */
export async function hasPermission(role: string, permissionCode: string): Promise<boolean> {
  await loadPermissionsCache()
  
  const rolePerms = permissionsCache.get(role)
  if (!rolePerms) return false
  
  return rolePerms.has(permissionCode)
}

/**
 * Helper function để lấy userId đúng từ database (dựa trên userId hoặc username)
 */
async function getCorrectUserId(userId: string, username?: string): Promise<string | null> {
  try {
    // Thử tìm user bằng userId
    const userById = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })
    
    if (userById) {
      return userById.id
    }
    
    // Nếu không tìm thấy, thử tìm bằng username
    if (username) {
      const userByUsername = await prisma.user.findUnique({
        where: { username },
        select: { id: true }
      })
      
      if (userByUsername) {
        return userByUsername.id
      }
    }
    
    return null
  } catch (error) {
    console.error('[getCorrectUserId] Error:', error)
    return null
  }
}

/**
 * Kiểm tra quyền của user cụ thể (bao gồm cả quyền đặc biệt)
 * Priority: UserPermission (deny) > UserPermission (grant) > RolePermission
 */
export async function hasUserPermission(userId: string, role: string, permissionCode: string, username?: string): Promise<boolean> {
  try {
    // Admin luôn được phép
    if (role === 'admin') {
      return true
    }

    // Lấy userId đúng từ database
    const correctUserId = await getCorrectUserId(userId, username)
    if (!correctUserId) {
      console.error('[hasUserPermission] User not found:', { userId, username })
      return false
    }

    // Lấy permission từ database
    const permission = await prisma.permission.findUnique({
      where: { code: permissionCode }
    })

    if (!permission) {
      return false
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

    // Debug logging
    if (permissionCode === 'view_tasks' || permissionCode === 'create_tasks' || permissionCode === 'view_exams' || permissionCode === 'create_exams') {
      console.log('[hasUserPermission] Debug:', {
        originalUserId: userId,
        correctUserId,
        username,
        role,
        permissionCode,
        userPerm: userPerm ? { type: userPerm.type, userId: userPerm.userId } : null
      })
    }

    // DENY có ưu tiên cao nhất
    if (userPerm && userPerm.type === 'deny') {
      return false
    }

    // GRANT cho phép luôn
    if (userPerm && userPerm.type === 'grant') {
      return true
    }

    // Check RolePermission
    const rolePerm = await prisma.rolePermission.findFirst({
      where: {
        role,
        permissionId: permission.id
      }
    })

    return !!rolePerm
  } catch (error) {
    console.error('[hasUserPermission] Error:', error)
    return false
  }
}

/**
 * Kiểm tra xem một role có ít nhất một trong các quyền không
 */
export async function hasAnyPermission(role: string, permissionCodes: string[]): Promise<boolean> {
  await loadPermissionsCache()
  
  const rolePerms = permissionsCache.get(role)
  if (!rolePerms) return false
  
  return permissionCodes.some(code => rolePerms.has(code))
}

/**
 * Kiểm tra xem một role có tất cả các quyền không
 */
export async function hasAllPermissions(role: string, permissionCodes: string[]): Promise<boolean> {
  await loadPermissionsCache()
  
  const rolePerms = permissionsCache.get(role)
  if (!rolePerms) return false
  
  return permissionCodes.every(code => rolePerms.has(code))
}

/**
 * Lấy tất cả permissions của một role
 */
export async function getRolePermissions(role: string): Promise<string[]> {
  await loadPermissionsCache()
  
  const rolePerms = permissionsCache.get(role)
  if (!rolePerms) return []
  
  return Array.from(rolePerms)
}

/**
 * Invalidate cache - gọi khi có thay đổi permissions
 */
export function invalidatePermissionsCache() {
  permissionsCache = new Map()
  cacheTimestamp = 0
}

/**
 * Kiểm tra quyền từ JWT user object (với UserPermission)
 */
export async function userHasPermission(user: { userId: string, role: string } | null, permissionCode: string): Promise<boolean> {
  if (!user) return false
  return hasUserPermission(user.userId, user.role, permissionCode)
}

/**
 * Kiểm tra user có ít nhất một trong các quyền (với UserPermission)
 */
export async function userHasAnyPermission(user: { userId: string, role: string } | null, permissionCodes: string[]): Promise<boolean> {
  if (!user) return false
  
  for (const code of permissionCodes) {
    const has = await hasUserPermission(user.userId, user.role, code)
    if (has) return true
  }
  
  return false
}

// Các permission codes - export để sử dụng trong code
export const PERMISSIONS = {
  // Exams
  VIEW_EXAMS: 'view_exams',
  CREATE_EXAMS: 'create_exams',
  EDIT_EXAMS: 'edit_exams',
  DELETE_EXAMS: 'delete_exams',
  EXPORT_EXAM_RESULTS: 'export_exam_results',
  ASSIGN_EXAMS: 'assign_exams',
  TOGGLE_EXAM_STATUS: 'toggle_exam_status',
  VIEW_EXAM_RESULTS: 'view_exam_results',
  
  // Tasks
  VIEW_TASKS: 'view_tasks',
  CREATE_TASKS: 'create_tasks',
  EDIT_TASKS: 'edit_tasks',
  DELETE_TASKS: 'delete_tasks',
  EXPORT_TASK_RESULTS: 'export_task_results',
  ASSIGN_TASKS: 'assign_tasks',
  UPLOAD_TASK_DATA: 'upload_task_data',
  VIEW_TASK_CUSTOMERS: 'view_task_customers',
  
  // Questions
  VIEW_QUESTIONS: 'view_questions',
  CREATE_QUESTIONS: 'create_questions',
  EDIT_QUESTIONS: 'edit_questions',
  DELETE_QUESTIONS: 'delete_questions',
  IMPORT_QUESTIONS: 'import_questions',
  
  // Users
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  
  // Videos
  VIEW_VIDEOS: 'view_videos',
  CREATE_VIDEOS: 'create_videos',
  EDIT_VIDEOS: 'edit_videos',
  DELETE_VIDEOS: 'delete_videos',
  
  // Documents
  VIEW_DOCUMENTS: 'view_documents',
  CREATE_DOCUMENTS: 'create_documents',
  EDIT_DOCUMENTS: 'edit_documents',
  DELETE_DOCUMENTS: 'delete_documents',
  
  // System
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_GROUPS: 'manage_groups',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_PERMISSIONS: 'manage_permissions',
} as const

