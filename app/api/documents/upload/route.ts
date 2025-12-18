import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const user = await getJWT(request)

    if (!user || !user.role) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    
    // Admin luôn được phép
    if (user.role !== 'admin') {
      const canCreate = await hasUserPermission(user.userId, user.role, PERMISSIONS.CREATE_DOCUMENTS, user.username)
      if (!canCreate) {
        return NextResponse.json({ error: 'Bạn không có quyền upload tài liệu' }, { status: 403 })
      }
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Không có file được tải lên' }, { status: 400 })
    }

    // Kiểm tra loại file (chỉ PDF)
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File phải là PDF' }, { status: 400 })
    }

    // Kiểm tra kích thước file (tối đa 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File quá lớn. Kích thước tối đa là 50MB' }, { status: 400 })
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
        contentType: 'application/pdf',
        token: token, // Truyền token trực tiếp
        addRandomSuffix: true, // Tự động thêm suffix ngẫu nhiên để tránh trùng tên
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
      
      // Trả về lỗi chi tiết để debug
      return NextResponse.json({ 
        error: `Lỗi khi upload tài liệu lên Vercel Blob: ${errorMessage}. Vui lòng kiểm tra Vercel Logs để biết chi tiết.` 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error uploading document:', error)
    const errorMessage = error.message || error.toString() || 'Unknown error'
    return NextResponse.json({ 
      error: `Lỗi khi upload tài liệu: ${errorMessage}` 
    }, { status: 500 })
  }
}

