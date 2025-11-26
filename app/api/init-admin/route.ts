import { NextResponse } from 'next/server'
import { initAdminUser } from '@/lib/auth'

export async function POST() {
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

