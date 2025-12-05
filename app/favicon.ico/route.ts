import { NextResponse } from 'next/server'

// Route handler để xử lý favicon.ico request
// Trả về 204 No Content để tránh lỗi 404
export async function GET() {
  return new NextResponse(null, {
    status: 204, // No Content
    headers: {
      'Content-Type': 'image/x-icon',
    },
  })
}

