import { NextRequest, NextResponse } from 'next/server'
import { getJWT } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await getJWT(request)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Lấy thông tin đầy đủ từ database
  const userFromDb = await prisma.user.findUnique({
    where: { username: user.username },
    select: { username: true, role: true, fullName: true },
  })

  return NextResponse.json({ 
    user: { 
      username: user.username,
      role: userFromDb?.role || user.role || 'user',
      fullName: userFromDb?.fullName || null,
    } 
  })
}

