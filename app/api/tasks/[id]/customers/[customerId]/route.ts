import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// Cập nhật khách hàng (Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; customerId: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được sửa khách hàng' }, { status: 403 })
    }

    const { stt, account, customerName, address, phone, assignedUsername } = await request.json()

    // Kiểm tra khách hàng có thuộc nhiệm vụ này không
    const customer = await prisma.taskCustomer.findUnique({
      where: { id: params.customerId },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 })
    }

    if (customer.taskId !== params.id) {
      return NextResponse.json({ error: 'Khách hàng không thuộc nhiệm vụ này' }, { status: 400 })
    }

    // Tìm user theo username nếu có
    let assignedUserId = null
    if (assignedUsername) {
      const assignedUser = await prisma.user.findUnique({
        where: { username: assignedUsername },
        select: { id: true }
      })
      if (assignedUser) {
        assignedUserId = assignedUser.id
      }
    }

    const updatedCustomer = await prisma.taskCustomer.update({
      where: { id: params.customerId },
      data: {
        ...(stt !== undefined && { stt: parseInt(stt.toString()) || 0 }),
        ...(account && { account }),
        ...(customerName && { customerName }),
        ...(address !== undefined && { address: address || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(assignedUsername !== undefined && { 
          assignedUserId,
          assignedUsername: assignedUsername || null 
        }),
      }
    })

    return NextResponse.json({ success: true, customer: updatedCustomer })
  } catch (error: any) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Lỗi khi cập nhật khách hàng: ' + error.message }, { status: 500 })
  }
}

// Xóa khách hàng (Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; customerId: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xóa khách hàng' }, { status: 403 })
    }

    // Kiểm tra khách hàng có thuộc nhiệm vụ này không
    const customer = await prisma.taskCustomer.findUnique({
      where: { id: params.customerId },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 })
    }

    if (customer.taskId !== params.id) {
      return NextResponse.json({ error: 'Khách hàng không thuộc nhiệm vụ này' }, { status: 400 })
    }

    await prisma.taskCustomer.delete({
      where: { id: params.customerId }
    })

    return NextResponse.json({ success: true, message: 'Đã xóa khách hàng thành công' })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Lỗi khi xóa khách hàng' }, { status: 500 })
  }
}

