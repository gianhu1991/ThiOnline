import { NextRequest, NextResponse } from 'next/server'
import { getJWT } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  const user = await getJWT(request)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ user: { username: user.username } })
}

