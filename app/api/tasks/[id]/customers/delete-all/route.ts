import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'

// Xóa tất cả khách hàng của nhiệm vụ (Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    // Admin luôn được phép
    if (user.role !== 'admin') {
      const canDelete = await hasUserPermission(user.userId, user.role, PERMISSIONS.DELETE_TASKS, user.username)
      if (!canDelete) {
        return NextResponse.json({ error: 'Bạn không có quyền xóa khách hàng' }, { status: 403 })
      }
    }

    // Kiểm tra nhiệm vụ tồn tại
    const task = await prisma.task.findUnique({
      where: { id: params.id }
    })

    if (!task) {
      return NextResponse.json({ error: 'Không tìm thấy nhiệm vụ' }, { status: 404 })
    }

    // Xóa tất cả khách hàng của nhiệm vụ
    const result = await prisma.taskCustomer.deleteMany({
      where: { taskId: params.id }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Đã xóa ${result.count} khách hàng thành công`,
      deletedCount: result.count
    })
  } catch (error: any) {
    console.error('Error deleting all customers:', error)
    return NextResponse.json({ error: 'Lỗi khi xóa khách hàng: ' + error.message }, { status: 500 })
  }
}

