import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Đảm bảo luôn lấy số liệu mới nhất, không cache
    const count = await prisma.examResult.count()
    
    // Thêm header để tránh cache
    return NextResponse.json({ count }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('Error fetching results count:', error)
    // Nếu bảng chưa tồn tại, trả về 0
    if (error.message?.includes('does not exist') || error.code === 'P2021') {
      return NextResponse.json({ count: 0 }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      })
    }
    return NextResponse.json({ count: 0 }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    })
  }
}

