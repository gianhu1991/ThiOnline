-- ============================================
-- MIGRATION: Thêm phân quyền theo từng user (đặc cách)
-- Database: PostgreSQL / Supabase
-- ============================================

-- Tạo bảng UserPermission
CREATE TABLE IF NOT EXISTS "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'grant' (cấp thêm) hoặc 'deny' (gỡ bỏ)
    "grantedBy" TEXT, -- Username người cấp quyền
    "reason" TEXT, -- Lý do cấp/gỡ quyền
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- Tạo unique constraint và indexes
CREATE UNIQUE INDEX IF NOT EXISTS "UserPermission_userId_permissionId_key" 
ON "UserPermission"("userId", "permissionId");

CREATE INDEX IF NOT EXISTS "UserPermission_userId_idx" 
ON "UserPermission"("userId");

CREATE INDEX IF NOT EXISTS "UserPermission_permissionId_idx" 
ON "UserPermission"("permissionId");

-- Thêm foreign key constraints
ALTER TABLE "UserPermission" 
DROP CONSTRAINT IF EXISTS "UserPermission_userId_fkey";

ALTER TABLE "UserPermission" 
ADD CONSTRAINT "UserPermission_userId_fkey" 
FOREIGN KEY ("userId") 
REFERENCES "User"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

ALTER TABLE "UserPermission" 
DROP CONSTRAINT IF EXISTS "UserPermission_permissionId_fkey";

ALTER TABLE "UserPermission" 
ADD CONSTRAINT "UserPermission_permissionId_fkey" 
FOREIGN KEY ("permissionId") 
REFERENCES "Permission"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Thông báo
DO $$
BEGIN
    RAISE NOTICE '✅ UserPermission table created!';
    RAISE NOTICE '📌 Bây giờ có thể phân quyền riêng cho từng user';
    RAISE NOTICE '   - grant: Cấp thêm quyền (vượt role)';
    RAISE NOTICE '   - deny: Gỡ bỏ quyền (ghi đè role)';
END $$;

