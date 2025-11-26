import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getJWT } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được upload video' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Không có file được tải lên' }, { status: 400 })
    }

    // Kiểm tra loại file
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'File phải là video' }, { status: 400 })
    }

    // Kiểm tra kích thước file (tối đa 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File quá lớn. Kích thước tối đa là 100MB' }, { status: 400 })
    }

    // Upload file lên Vercel Blob
    try {
      const blob = await put(file.name, file, {
        access: 'public',
        contentType: file.type,
      })

      return NextResponse.json({ 
        success: true, 
        url: blob.url,
        filename: file.name,
        size: file.size,
        type: file.type
      })
    } catch (blobError: any) {
      // Kiểm tra nếu lỗi do thiếu token
      if (blobError.message?.includes('BLOB_READ_WRITE_TOKEN') || blobError.message?.includes('token')) {
        return NextResponse.json({ 
          error: 'Vui lòng cấu hình BLOB_READ_WRITE_TOKEN trong Vercel Environment Variables. Xem hướng dẫn tại: https://vercel.com/docs/storage/vercel-blob' 
        }, { status: 500 })
      }
      throw blobError
    }
  } catch (error: any) {
    console.error('Error uploading video:', error)
    return NextResponse.json({ 
      error: 'Lỗi khi upload video: ' + (error.message || 'Unknown error') 
    }, { status: 500 })
  }
}

