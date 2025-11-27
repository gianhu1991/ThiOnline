import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getJWT } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được upload thumbnail' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Không có file được tải lên' }, { status: 400 })
    }

    // Kiểm tra loại file (chỉ hình ảnh)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File phải là hình ảnh (JPG, PNG, GIF, WebP)' }, { status: 400 })
    }

    // Kiểm tra kích thước file (tối đa 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File quá lớn. Kích thước tối đa là 5MB' }, { status: 400 })
    }

    // Kiểm tra token trước khi upload (hỗ trợ cả BLOB_READ_WRITE_TOKEN và luutru_READ_WRITE_TOKEN)
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.luutru_READ_WRITE_TOKEN
    if (!token) {
      console.error('Blob token is missing. Checked: BLOB_READ_WRITE_TOKEN, luutru_READ_WRITE_TOKEN')
      return NextResponse.json({ 
        error: 'Token Blob Storage chưa được cấu hình. Vui lòng kiểm tra Environment Variables có BLOB_READ_WRITE_TOKEN hoặc luutru_READ_WRITE_TOKEN (đảm bảo có ở Production) và redeploy.' 
      }, { status: 500 })
    }

    // Upload file lên Vercel Blob
    try {
      const blob = await put(file.name, file, {
        access: 'public',
        contentType: file.type,
        token: token,
        addRandomSuffix: true,
      })

      return NextResponse.json({ 
        success: true, 
        url: blob.url,
        filename: file.name,
        size: file.size,
        type: file.type
      })
    } catch (blobError: any) {
      console.error('Vercel Blob Error:', blobError)
      const errorMessage = blobError.message || blobError.toString() || 'Unknown error'
      
      if (errorMessage.includes('BLOB_READ_WRITE_TOKEN') || 
          errorMessage.includes('token') ||
          errorMessage.includes('Unauthorized') ||
          errorMessage.includes('401') ||
          errorMessage.includes('Missing')) {
        return NextResponse.json({ 
          error: `Lỗi token BLOB_READ_WRITE_TOKEN: ${errorMessage}. Vui lòng kiểm tra: 1) Token có ở Production environment, 2) Token đúng với Blob Store, 3) Đã redeploy sau khi thêm token.` 
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: `Lỗi khi upload thumbnail lên Vercel Blob: ${errorMessage}. Vui lòng kiểm tra Vercel Logs để biết chi tiết.` 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error uploading thumbnail:', error)
    const errorMessage = error.message || error.toString() || 'Unknown error'
    return NextResponse.json({ 
      error: `Lỗi khi upload thumbnail: ${errorMessage}` 
    }, { status: 500 })
  }
}

