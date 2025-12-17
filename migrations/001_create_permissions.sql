-- Migration: Tạo bảng Permission và RolePermission
-- Chạy thủ công trong PostgreSQL

-- 1. Tạo bảng Permission
CREATE TABLE IF NOT EXISTS "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- 2. Tạo index và unique constraint cho Permission
CREATE UNIQUE INDEX IF NOT EXISTS "Permission_code_key" ON "Permission"("code");

-- 3. Tạo bảng RolePermission
CREATE TABLE IF NOT EXISTS "RolePermission" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- 4. Tạo unique constraint và indexes cho RolePermission
CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_role_permissionId_key" ON "RolePermission"("role", "permissionId");
CREATE INDEX IF NOT EXISTS "RolePermission_role_idx" ON "RolePermission"("role");
CREATE INDEX IF NOT EXISTS "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- 5. Thêm foreign key constraint
ALTER TABLE "RolePermission" 
ADD CONSTRAINT "RolePermission_permissionId_fkey" 
FOREIGN KEY ("permissionId") 
REFERENCES "Permission"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Migration completed
-- Tiếp theo: Chạy script seed để insert dữ liệu permissions

