# 🚀 Hướng dẫn setup hệ thống phân quyền trên Supabase

## Bước 1: Mở Supabase SQL Editor

1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **SQL Editor** (menu bên trái)
4. Nhấn **New query**

## Bước 2: Copy và chạy Migration

1. Mở file `migrations/SUPABASE_MIGRATION.sql`
2. **Copy toàn bộ nội dung** (Ctrl+A → Ctrl+C)
3. **Paste vào SQL Editor** trong Supabase (Ctrl+V)
4. Nhấn nút **RUN** (hoặc Ctrl+Enter)

⏱️ **Thời gian chạy:** Khoảng 2-5 giây

## Bước 3: Kiểm tra kết quả

Sau khi chạy xong, bạn sẽ thấy thông báo:

```
✅ Migration hoàn tất!
📊 Tổng số Permissions: 40
👑 Admin có 40 quyền
📈 Leader có 10 quyền
👤 User có 2 quyền
```

### Kiểm tra bảng đã tạo

Vào **Table Editor** trong Supabase, bạn sẽ thấy 2 bảng mới:
- `Permission` (40 records)
- `RolePermission` (52 records: 40 admin + 10 leader + 2 user)

### Query kiểm tra nhanh

```sql
-- Xem tất cả permissions
SELECT * FROM "Permission" ORDER BY category, code;

-- Xem quyền của Leader
SELECT p.code, p.name, p.category
FROM "RolePermission" rp
JOIN "Permission" p ON p.id = rp."permissionId"
WHERE rp.role = 'leader'
ORDER BY p.category;

-- Đếm số quyền của mỗi role
SELECT role, COUNT(*) as total_permissions
FROM "RolePermission"
GROUP BY role;
```

## Bước 4: Cập nhật Connection String (nếu cần)

Nếu app chưa kết nối đúng database, cập nhật `.env`:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

Lấy connection string từ: **Settings > Database > Connection string**

## Bước 5: Test hệ thống phân quyền

1. Deploy app lên Vercel
2. Đăng nhập với tài khoản admin
3. Vào **Settings > Phân quyền chi tiết**
4. Thay đổi quyền của Leader và lưu
5. Đăng xuất và đăng nhập với tài khoản Leader để test

## 🔍 Troubleshooting

### Lỗi: "relation Permission already exists"

Bảng đã tồn tại. Chạy lệnh xóa trước:

```sql
DROP TABLE IF EXISTS "RolePermission" CASCADE;
DROP TABLE IF EXISTS "Permission" CASCADE;
```

Sau đó chạy lại migration.

### Lỗi: "function gen_random_uuid() does not exist"

Supabase luôn có sẵn `gen_random_uuid()`, không cần enable extension. Nếu vẫn lỗi, thử:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Kiểm tra xem extension đã có chưa

```sql
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
```

## 📊 Cấu trúc Permissions

| Category | Số lượng | Ví dụ |
|----------|----------|-------|
| exams | 8 | view_exams, create_exams, export_exam_results |
| tasks | 8 | view_tasks, create_tasks, export_task_results |
| questions | 5 | view_questions, create_questions, import_questions |
| users | 4 | view_users, create_users, edit_users |
| videos | 4 | view_videos, create_videos, edit_videos |
| documents | 4 | view_documents, create_documents, edit_documents |
| system | 4 | manage_categories, manage_groups, manage_permissions |

## 🎯 Phân quyền mặc định

### Admin (40 quyền)
- ✅ Toàn quyền: Tất cả 40 permissions

### Leader (10 quyền)
- ✅ Xem bài thi, kết quả, xuất Excel
- ✅ Xem nhiệm vụ, khách hàng, xuất Excel
- ✅ Xem câu hỏi, người dùng, video, tài liệu
- ❌ Không được tạo/sửa/xóa

### User (2 quyền)
- ✅ Xem video
- ✅ Xem tài liệu
- ❌ Không truy cập admin features

## 🔄 Rollback (Xóa hệ thống phân quyền)

Nếu cần xóa và làm lại:

```sql
-- Xóa dữ liệu
DELETE FROM "RolePermission";
DELETE FROM "Permission";

-- Hoặc xóa toàn bộ bảng
DROP TABLE IF EXISTS "RolePermission" CASCADE;
DROP TABLE IF EXISTS "Permission" CASCADE;
```

## 📝 Lưu ý quan trọng

1. **Backup trước khi chạy**: Supabase tự động backup, nhưng nên export data quan trọng
2. **Chạy 1 lần duy nhất**: Migration có `ON CONFLICT DO NOTHING` để tránh duplicate
3. **Foreign key**: Khi xóa Permission, tất cả RolePermission liên quan sẽ tự động xóa (CASCADE)
4. **Cache**: Sau khi thay đổi permissions, cache sẽ tự động refresh sau 5 phút

## ✅ Checklist hoàn thành

- [ ] Chạy migration thành công trong Supabase
- [ ] Kiểm tra 2 bảng mới trong Table Editor
- [ ] Verify có 40 permissions và 52 role_permissions
- [ ] Test đăng nhập với role leader
- [ ] Vào Settings > Phân quyền chi tiết để xem UI quản lý
- [ ] Thử thay đổi quyền và lưu

---

🎉 **Hoàn tất!** Hệ thống phân quyền đã sẵn sàng sử dụng.

