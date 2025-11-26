import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ 
      error: 'DATABASE_URL không tồn tại',
      hasUrl: false
    }, { status: 500 })
  }

  // Kiểm tra format
  const isValid = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')
  
  // Hiển thị một phần để debug (không hiển thị toàn bộ để bảo mật)
  const preview = dbUrl.substring(0, 30) + '...'
  const length = dbUrl.length

  return NextResponse.json({
    hasUrl: true,
    isValid,
    preview,
    length,
    startsWithPostgresql: dbUrl.startsWith('postgresql://'),
    startsWithPostgres: dbUrl.startsWith('postgres://'),
    message: isValid 
      ? '✅ DATABASE_URL có format đúng' 
      : '❌ DATABASE_URL thiếu protocol. Phải bắt đầu bằng postgresql:// hoặc postgres://'
  })
}

