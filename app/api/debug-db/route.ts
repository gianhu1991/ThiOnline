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
  
  // Kiểm tra port
  const hasPooling = dbUrl.includes(':6543') || dbUrl.includes('pooler.supabase.com')
  const hasDirect = dbUrl.includes(':5432')
  const hasConnectionLimit = dbUrl.includes('connection_limit')
  
  // Hiển thị một phần để debug (không hiển thị toàn bộ để bảo mật)
  const preview = dbUrl.substring(0, 50) + '...'
  const length = dbUrl.length

  return NextResponse.json({
    hasUrl: true,
    isValid,
    preview,
    length,
    startsWithPostgresql: dbUrl.startsWith('postgresql://'),
    startsWithPostgres: dbUrl.startsWith('postgres://'),
    hasPooling,
    hasDirect,
    hasConnectionLimit,
    isRecommended: hasPooling || (hasDirect && hasConnectionLimit),
    message: isValid 
      ? (hasPooling 
          ? '✅ DATABASE_URL có format đúng (Connection Pooling - Khuyến nghị cho Vercel)' 
          : hasDirect && hasConnectionLimit
          ? '✅ DATABASE_URL có format đúng (Direct với connection_limit)'
          : '⚠️ DATABASE_URL đúng format nhưng nên dùng Connection Pooling (port 6543) hoặc thêm connection_limit=1')
      : '❌ DATABASE_URL thiếu protocol. Phải bắt đầu bằng postgresql:// hoặc postgres://'
  })
}

