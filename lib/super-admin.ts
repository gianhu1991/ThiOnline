import { prisma } from '@/lib/prisma'

/**
 * Kiểm tra xem user có phải là super admin không
 * Super admin là:
 * 1. User có username = "admin"
 * 2. Hoặc user đầu tiên được tạo trong hệ thống
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    // Lấy thông tin user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, role: true },
    })

    if (!user || user.role !== 'admin') {
      return false
    }

    // User có username = "admin" luôn là Super Admin
    if (user.username === 'admin') {
      return true
    }

    // Hoặc kiểm tra xem user có phải là user đầu tiên được tạo không
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })

    return firstUser?.id === userId
  } catch (error) {
    console.error('Error checking super admin:', error)
    return false
  }
}

/**
 * Kiểm tra super admin bằng username (dùng khi chỉ có username từ JWT)
 * Super admin là:
 * 1. User có username = "admin"
 * 2. Hoặc user đầu tiên được tạo trong hệ thống
 */
export async function isSuperAdminByUsername(username: string): Promise<boolean> {
  try {
    // User có username = "admin" luôn là Super Admin (kiểm tra đầu tiên)
    if (username === 'admin') {
      console.log(`[SuperAdmin Check] Username "${username}" is Super Admin (admin user)`)
      return true
    }

    // Lấy user từ database
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, role: true, createdAt: true },
    })

    if (!user) {
      console.log(`[SuperAdmin Check] User ${username} not found in database`)
      return false
    }

    if (user.role !== 'admin') {
      console.log(`[SuperAdmin Check] User ${username} is not admin (role: ${user.role})`)
      return false
    }

    // Kiểm tra xem user có phải là user đầu tiên được tạo không
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, username: true, createdAt: true },
    })

    if (!firstUser) {
      console.log('[SuperAdmin Check] No users found in database')
      return false
    }

    const isSuperAdmin = firstUser.id === user.id
    
    console.log(`[SuperAdmin Check] Username: ${username}, User ID: ${user.id}, First User ID: ${firstUser.id}, First User Username: ${firstUser.username}, Is Super Admin: ${isSuperAdmin}`)
    
    return isSuperAdmin
  } catch (error) {
    console.error('Error checking super admin by username:', error)
    return false
  }
}

