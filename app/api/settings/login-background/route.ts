import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'
import { put } from '@vercel/blob'

// GET: Lấy background hiện tại
export async function GET(request: NextRequest) {
  try {
    const backgroundSetting = await prisma.settings.findUnique({
      where: { key: 'login_background' },
    })

    const formPositionSetting = await prisma.settings.findUnique({
      where: { key: 'login_form_position' },
    })

    let formPosition = null
    if (formPositionSetting?.value) {
      try {
        formPosition = JSON.parse(formPositionSetting.value)
      } catch (e) {
        console.error('Error parsing formPosition:', e)
      }
    }

    return NextResponse.json({ 
      success: true, 
      backgroundUrl: backgroundSetting?.value || null,
      formPosition: formPosition
    })
  } catch (error: any) {
    console.error('Error fetching login background:', error)
    return NextResponse.json({ 
      success: true, 
      backgroundUrl: null,
      formPosition: null
    })
  }
}

// POST: Upload và lưu background mới
export async function POST(request: NextRequest) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được thay đổi ảnh nền' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const formPositionStr = formData.get('formPosition') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Không có file được tải lên' }, { status: 400 })
    }

    // Parse formPosition nếu có
    let formPosition = null
    if (formPositionStr) {
      try {
        formPosition = JSON.parse(formPositionStr)
      } catch (e) {
        console.error('Error parsing formPosition:', e)
      }
    }

    // Kiểm tra loại file (chỉ hình ảnh)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File phải là hình ảnh (JPG, PNG, GIF, WebP)' }, { status: 400 })
    }

    // Kiểm tra kích thước file (tối đa 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File quá lớn. Kích thước tối đa là 10MB' }, { status: 400 })
    }

    // Kiểm tra token
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.luutru_READ_WRITE_TOKEN
    if (!token) {
      return NextResponse.json({ 
        error: 'BLOB_READ_WRITE_TOKEN chưa được cấu hình' 
      }, { status: 500 })
    }

    // Upload file lên Vercel Blob
    try {
      const blob = await put(`login-background-${Date.now()}.${file.name.split('.').pop()}`, file, {
        access: 'public',
        contentType: file.type,
        token: token,
        addRandomSuffix: true,
      })

      // Lưu URL vào database
      await prisma.settings.upsert({
        where: { key: 'login_background' },
        update: { value: blob.url },
        create: { key: 'login_background', value: blob.url },
      })

      // Lưu formPosition nếu có
      if (formPosition) {
        await prisma.settings.upsert({
          where: { key: 'login_form_position' },
          update: { value: JSON.stringify(formPosition) },
          create: { key: 'login_form_position', value: JSON.stringify(formPosition) },
        })
      }

      return NextResponse.json({ 
        success: true, 
        url: blob.url,
        message: 'Cập nhật ảnh nền thành công'
      })
    } catch (blobError: any) {
      console.error('Vercel Blob Error:', blobError)
      return NextResponse.json({ 
        error: `Lỗi khi upload ảnh: ${blobError.message || 'Unknown error'}` 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error uploading login background:', error)
    return NextResponse.json({ 
      error: `Lỗi khi upload ảnh nền: ${error.message || 'Unknown error'}` 
    }, { status: 500 })
  }
}

// DELETE: Xóa background (trở về mặc định)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được xóa ảnh nền' }, { status: 403 })
    }

    await prisma.settings.deleteMany({
      where: { key: 'login_background' },
    })

    return NextResponse.json({ 
      success: true,
      message: 'Đã xóa ảnh nền, trở về mặc định'
    })
  } catch (error: any) {
    console.error('Error deleting login background:', error)
    return NextResponse.json({ 
      error: 'Lỗi khi xóa ảnh nền' 
    }, { status: 500 })
  }
}
