import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// Kiểm tra xem user hiện tại có phải là super admin không (user đầu tiên được tạo)
export async function GET(request: NextRequest) {
  try {
    const user = await getJWT(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ isSuperAdmin: false })
    }

    // Lấy user đầu tiên được tạo
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })

    const isSuperAdmin = firstUser?.id === user.userId

    return NextResponse.json({ isSuperAdmin })
  } catch (error: any) {
    console.error('Error checking super admin:', error)
    return NextResponse.json({ isSuperAdmin: false })
  }
}

