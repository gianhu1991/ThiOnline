# Hướng dẫn chạy Migration thủ công

## Cách 1: Chạy qua psql (Command line)

### Bước 1: Kết nối vào database
```bash
# Thay thế connection string bằng DATABASE_URL của bạn
psql "your_database_url_here"
```

### Bước 2: Chạy file migration
```bash
# Chạy file tạo bảng
\i migrations/001_create_permissions.sql

# Chạy file seed dữ liệu
\i migrations/002_seed_permissions.sql
```

### Bước 3: Kiểm tra kết quả
```sql
-- Xem số lượng permissions
SELECT COUNT(*) FROM "Permission";

-- Xem số lượng role permissions
SELECT role, COUNT(*) FROM "RolePermission" GROUP BY role;
```

---

## Cách 2: Copy/Paste vào pgAdmin hoặc Vercel Postgres Dashboard

### Bước 1: Tạo bảng
1. Mở file `migrations/001_create_permissions.sql`
2. Copy toàn bộ nội dung
3. Paste vào SQL Editor
4. Execute

### Bước 2: Seed dữ liệu
1. Mở file `migrations/002_seed_permissions.sql`
2. Copy toàn bộ nội dung
3. Paste vào SQL Editor
4. Execute

---

## Cách 3: Chạy qua Prisma (Khuyến nghị)

Nếu môi trường hỗ trợ Node.js:

```bash
# Bước 1: Push schema để tạo bảng
npx prisma db push

# Bước 2: Chạy script seed
npx ts-node prisma/seed-permissions.ts
```

---

## Cách 4: Chạy từng lệnh SQL (Manual)

Nếu không thể chạy file, copy từng block SQL:

### 1. Tạo bảng Permission
```sql
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

CREATE UNIQUE INDEX IF NOT EXISTS "Permission_code_key" ON "Permission"("code");
```

### 2. Tạo bảng RolePermission
```sql
CREATE TABLE IF NOT EXISTS "RolePermission" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_role_permissionId_key" ON "RolePermission"("role", "permissionId");
CREATE INDEX IF NOT EXISTS "RolePermission_role_idx" ON "RolePermission"("role");
CREATE INDEX IF NOT EXISTS "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

ALTER TABLE "RolePermission" 
ADD CONSTRAINT "RolePermission_permissionId_fkey" 
FOREIGN KEY ("permissionId") 
REFERENCES "Permission"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;
```

### 3. Sau đó chạy file seed
Copy nội dung từ `migrations/002_seed_permissions.sql` và execute

---

## Kiểm tra sau khi migration

```sql
-- Xem tất cả permissions
SELECT code, name, category FROM "Permission" ORDER BY category, code;

-- Xem quyền của Admin
SELECT p.code, p.name 
FROM "RolePermission" rp
JOIN "Permission" p ON p.id = rp."permissionId"
WHERE rp.role = 'admin'
ORDER BY p.category, p.code;

-- Xem quyền của Leader
SELECT p.code, p.name 
FROM "RolePermission" rp
JOIN "Permission" p ON p.id = rp."permissionId"
WHERE rp.role = 'leader'
ORDER BY p.category, p.code;

-- Xem quyền của User
SELECT p.code, p.name 
FROM "RolePermission" rp
JOIN "Permission" p ON p.id = rp."permissionId"
WHERE rp.role = 'user'
ORDER BY p.category, p.code;
```

---

## Lưu ý

- **PostgreSQL**: Các lệnh trên dành cho PostgreSQL
- **gen_random_uuid()**: Cần extension `pgcrypto` (thường đã có sẵn)
- **Nếu lỗi**: Kiểm tra xem bảng đã tồn tại chưa bằng `\dt` (psql) hoặc query `SELECT * FROM information_schema.tables WHERE table_name = 'Permission'`

---

## Rollback (Nếu cần xóa)

```sql
-- Xóa dữ liệu
DELETE FROM "RolePermission";
DELETE FROM "Permission";

-- Xóa bảng (cẩn thận!)
DROP TABLE IF EXISTS "RolePermission" CASCADE;
DROP TABLE IF EXISTS "Permission" CASCADE;
```

