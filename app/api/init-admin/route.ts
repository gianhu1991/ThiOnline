import { NextResponse } from 'next/server'
import { initAdminUser } from '@/lib/auth'

export async function GET() {
  try {
    await initAdminUser()
    return NextResponse.json({ 
      success: true, 
      message: 'Admin user initialized successfully',
      username: 'admin',
      password: 'Bdnb@999'
    })
  } catch (error: any) {
    console.error('Init admin error:', error)
    
    // Kiểm tra nếu bảng User chưa tồn tại
    if (error.message?.includes('does not exist') || error.code === 'P2021' || error.message?.includes('User')) {
      return NextResponse.json({ 
        error: 'Bảng User chưa tồn tại. Vui lòng chạy migration SQL trước.',
        hint: 'Chạy SQL: CREATE TABLE IF NOT EXISTS "User" (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, createdAt TIMESTAMP DEFAULT NOW(), updatedAt TIMESTAMP)'
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: error.message || 'Lỗi khi khởi tạo admin user',
      details: error.toString()
    }, { status: 500 })
  }
}

export async function POST() {
  return GET()
}

