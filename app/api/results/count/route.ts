import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const count = await prisma.examResult.count()
    return NextResponse.json({ count })
  } catch (error: any) {
    console.error('Error fetching results count:', error)
    // Nếu bảng chưa tồn tại, trả về 0
    if (error.message?.includes('does not exist') || error.code === 'P2021') {
      return NextResponse.json({ count: 0 })
    }
    return NextResponse.json({ count: 0 })
  }
}

