import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Chỉ cho phép chạy migration trong môi trường development hoặc với quyền admin
    // Trong production, nên chạy SQL migration trực tiếp trong Supabase

    const result = await prisma.$executeRawUnsafe(`
      -- Tạo bảng UserGroup (nếu chưa có)
      CREATE TABLE IF NOT EXISTS "UserGroup" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
      );

      -- Tạo bảng UserGroupMember (nếu chưa có)
      CREATE TABLE IF NOT EXISTS "UserGroupMember" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "groupId" TEXT NOT NULL,
          "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
          FOREIGN KEY ("groupId") REFERENCES "UserGroup"("id") ON DELETE CASCADE,
          UNIQUE("userId", "groupId")
      );

      CREATE INDEX IF NOT EXISTS "UserGroupMember_userId_idx" ON "UserGroupMember"("userId");
      CREATE INDEX IF NOT EXISTS "UserGroupMember_groupId_idx" ON "UserGroupMember"("groupId");

      -- Tạo bảng VideoGroup (nếu chưa có)
      CREATE TABLE IF NOT EXISTS "VideoGroup" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "videoId" TEXT NOT NULL,
          "groupId" TEXT NOT NULL,
          "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE,
          FOREIGN KEY ("groupId") REFERENCES "UserGroup"("id") ON DELETE CASCADE,
          UNIQUE("videoId", "groupId")
      );

      CREATE INDEX IF NOT EXISTS "VideoGroup_videoId_idx" ON "VideoGroup"("videoId");
      CREATE INDEX IF NOT EXISTS "VideoGroup_groupId_idx" ON "VideoGroup"("groupId");

      -- Tạo bảng DocumentGroup (nếu chưa có)
      CREATE TABLE IF NOT EXISTS "DocumentGroup" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "documentId" TEXT NOT NULL,
          "groupId" TEXT NOT NULL,
          "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE,
          FOREIGN KEY ("groupId") REFERENCES "UserGroup"("id") ON DELETE CASCADE,
          UNIQUE("documentId", "groupId")
      );

      CREATE INDEX IF NOT EXISTS "DocumentGroup_documentId_idx" ON "DocumentGroup"("documentId");
      CREATE INDEX IF NOT EXISTS "DocumentGroup_groupId_idx" ON "DocumentGroup"("groupId");
    `)

    return NextResponse.json({ 
      success: true, 
      message: 'Migration thành công. Các bảng UserGroup, UserGroupMember, VideoGroup, DocumentGroup đã được tạo.' 
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Lỗi khi chạy migration: ' + error.message,
      note: 'Nếu các bảng đã tồn tại, bạn có thể bỏ qua lỗi này. Hoặc chạy SQL migration trực tiếp trong Supabase SQL Editor.'
    }, { status: 500 })
  }
}

