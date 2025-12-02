import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJWT } from '@/lib/jwt'

// GET: Lấy footer text hiện tại
export async function GET(request: NextRequest) {
  try {
    const copyrightSetting = await prisma.settings.findUnique({
      where: { key: 'footer_copyright' },
    })

    const developerSetting = await prisma.settings.findUnique({
      where: { key: 'footer_developer' },
    })

    return NextResponse.json({ 
      success: true, 
      copyright: copyrightSetting?.value || '© 2025 TTVT Nho Quan- Phần mềm đào tạo kỹ thuật',
      developer: developerSetting?.value || 'Phát triển bởi nhuqg.nbh'
    })
  } catch (error: any) {
    console.error('Error fetching footer text:', error)
    return NextResponse.json({ 
      success: true, 
      copyright: '© 2025 TTVT Nho Quan- Phần mềm đào tạo kỹ thuật',
      developer: 'Phát triển bởi nhuqg.nbh'
    })
  }
}

// PUT: Cập nhật footer text
export async function PUT(request: NextRequest) {
  try {
    const user = await getJWT(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ admin mới được thay đổi footer' }, { status: 403 })
    }

    const { copyright, developer } = await request.json()

    if (!copyright || !copyright.trim()) {
      return NextResponse.json({ error: 'Copyright không được để trống' }, { status: 400 })
    }

    if (!developer || !developer.trim()) {
      return NextResponse.json({ error: 'Developer không được để trống' }, { status: 400 })
    }

    await Promise.all([
      prisma.settings.upsert({
        where: { key: 'footer_copyright' },
        update: { value: copyright.trim() },
        create: { key: 'footer_copyright', value: copyright.trim() },
      }),
      prisma.settings.upsert({
        where: { key: 'footer_developer' },
        update: { value: developer.trim() },
        create: { key: 'footer_developer', value: developer.trim() },
      }),
    ])

    return NextResponse.json({ 
      success: true,
      message: 'Cập nhật footer thành công'
    })
  } catch (error: any) {
    console.error('Error updating footer:', error)
    return NextResponse.json({ 
      error: `Lỗi khi cập nhật footer: ${error.message || 'Unknown error'}` 
    }, { status: 500 })
  }
}

