import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// Xóa tất cả khách hàng của nhiệm vụ (Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xóa khách hàng' }, { status: 403 })
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

