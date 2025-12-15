import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getJWT } from '@/lib/jwt'

// Vercel có giới hạn 4.5MB cho request body
// Giải pháp: Sử dụng streaming upload hoặc chunked upload
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 phút cho upload lớn

// Tắt body parsing để xử lý streaming
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được upload video' }, { status: 403 })
    }

    // Kiểm tra Content-Type
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Request phải là multipart/form-data' }, { status: 400 })
    }

    // Parse FormData - Next.js sẽ tự động parse nhưng có giới hạn 4.5MB
    // Nếu file > 4.5MB, sẽ bị lỗi 413 trước khi đến đây
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

    console.log(`[Video Upload] Bắt đầu upload: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`)

    // Kiểm tra token trước khi upload
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.luutru_READ_WRITE_TOKEN
    if (!token) {
      console.error('Blob token is missing. Checked: BLOB_READ_WRITE_TOKEN, luutru_READ_WRITE_TOKEN')
      return NextResponse.json({ 
        error: 'Token Blob Storage chưa được cấu hình. Vui lòng kiểm tra Environment Variables có BLOB_READ_WRITE_TOKEN hoặc luutru_READ_WRITE_TOKEN (đảm bảo có ở Production) và redeploy.' 
      }, { status: 500 })
    }

    // Upload file lên Vercel Blob sử dụng streaming
    try {
      // Sử dụng stream từ file để upload trực tiếp, tránh load toàn bộ vào memory
      const blob = await put(file.name, file.stream(), {
        access: 'public',
        contentType: file.type,
        token: token,
        addRandomSuffix: true,
      })

      console.log(`[Video Upload] Upload thành công: ${blob.url}`)

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
      
      // Kiểm tra các loại lỗi phổ biến
      if (errorMessage.includes('BLOB_READ_WRITE_TOKEN') || 
          errorMessage.includes('token') ||
          errorMessage.includes('Unauthorized') ||
          errorMessage.includes('401') ||
          errorMessage.includes('Missing')) {
        return NextResponse.json({ 
          error: `Lỗi token BLOB_READ_WRITE_TOKEN: ${errorMessage}. Vui lòng kiểm tra: 1) Token có ở Production environment, 2) Token đúng với Blob Store, 3) Đã redeploy sau khi thêm token. Xem hướng dẫn: https://vercel.com/docs/storage/vercel-blob` 
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: `Lỗi khi upload video lên Vercel Blob: ${errorMessage}. Vui lòng kiểm tra Vercel Logs để biết chi tiết.` 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error uploading video:', error)
    const errorMessage = error.message || error.toString() || 'Unknown error'
    
    // Kiểm tra lỗi 413 (Payload Too Large)
    if (errorMessage.includes('413') || 
        errorMessage.includes('Payload Too Large') || 
        errorMessage.includes('too large') ||
        errorMessage.includes('Request Entity Too Large')) {
      return NextResponse.json({ 
        error: 'File quá lớn. Vercel có giới hạn 4.5MB cho request body qua API route. Vui lòng:\n1. Sử dụng video nhỏ hơn 4.5MB, hoặc\n2. Upload video lên một dịch vụ lưu trữ khác (YouTube, Vimeo, etc.) và nhập URL, hoặc\n3. Nén video trước khi upload.' 
      }, { status: 413 })
    }
    
    return NextResponse.json({ 
      error: `Lỗi khi upload video: ${errorMessage}` 
    }, { status: 500 })
  }
}

