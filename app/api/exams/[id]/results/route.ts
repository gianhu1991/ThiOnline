import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const results = await prisma.examResult.findMany({
      where: { examId: params.id },
      orderBy: { completedAt: 'desc' },
    })

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi lấy kết quả' }, { status: 500 })
  }
}

