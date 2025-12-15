import { NextRequest, NextResponse } from 'next/server'
import { getJWT } from '@/lib/jwt'

// Endpoint để lấy upload token cho client-side upload
// Token này sẽ được sử dụng để upload trực tiếp lên Vercel Blob từ client
export async function POST(request: NextRequest) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được upload video' }, { status: 403 })
    }

    const body = await request.json()
    const { filename, contentType, size } = body

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Thiếu thông tin file' }, { status: 400 })
    }

    // Kiểm tra loại file
    if (!contentType.startsWith('video/')) {
      return NextResponse.json({ error: 'File phải là video' }, { status: 400 })
    }

    // Kiểm tra kích thước file (tối đa 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (size && size > maxSize) {
      return NextResponse.json({ error: 'File quá lớn. Kích thước tối đa là 100MB' }, { status: 400 })
    }

    // Kiểm tra token
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.luutru_READ_WRITE_TOKEN
    if (!token) {
      return NextResponse.json({ 
        error: 'Token Blob Storage chưa được cấu hình' 
      }, { status: 500 })
    }

    // Trả về token để client upload trực tiếp
    // Lưu ý: Token này chỉ nên được sử dụng một lần và có thời hạn ngắn
    // Trong production, nên implement một cơ chế token tạm thời an toàn hơn
    return NextResponse.json({ 
      success: true,
      token: token,
      // Thông tin để upload
      addRandomSuffix: true,
      access: 'public'
    })
  } catch (error: any) {
    console.error('Error getting upload token:', error)
    return NextResponse.json({ 
      error: `Lỗi: ${error.message || 'Unknown error'}` 
    }, { status: 500 })
  }
}

