import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// Lấy chi tiết nhiệm vụ
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        customers: {
          orderBy: { stt: 'asc' }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, username: true, fullName: true }
            }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Không tìm thấy nhiệm vụ' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (error: any) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Lỗi khi lấy thông tin nhiệm vụ' }, { status: 500 })
  }
}

// Cập nhật nhiệm vụ (Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được cập nhật nhiệm vụ' }, { status: 403 })
    }

    const { name, description, isActive, startDate, endDate, dailyAssignmentCount } = await request.json()

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(dailyAssignmentCount !== undefined && { dailyAssignmentCount }),
      }
    })

    return NextResponse.json({ task })
  } catch (error: any) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Lỗi khi cập nhật nhiệm vụ' }, { status: 500 })
  }
}

// Xóa nhiệm vụ (Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xóa nhiệm vụ' }, { status: 403 })
    }

    await prisma.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Lỗi khi xóa nhiệm vụ' }, { status: 500 })
  }
}

