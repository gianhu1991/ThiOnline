# 🎯 Phân quyền theo từng User (Đặc cách)

## Tổng quan

Hệ thống hỗ trợ **phân quyền đặc biệt cho từng user** để xử lý các trường hợp ngoại lệ mà không cần thay đổi role.

### Cơ chế hoạt động

```
Priority: UserPermission (deny) > UserPermission (grant) > RolePermission
```

1. **Deny** (Gỡ bỏ quyền): User mất quyền này dù role có quyền
2. **Grant** (Cấp thêm quyền): User được quyền này dù role không có
3. **RolePermission**: Quyền mặc định từ role

## 📊 Cấu trúc Database

### Bảng `UserPermission`

| Field | Type | Mô tả |
|-------|------|-------|
| id | TEXT | ID |
| userId | TEXT | ID của user |
| permissionId | TEXT | ID của permission |
| type | TEXT | "grant" hoặc "deny" |
| grantedBy | TEXT | Username người cấp quyền |
| reason | TEXT | Lý do (ví dụ: "Đặc cách cho dự án X") |
| createdAt | TIMESTAMP | Thời gian tạo |

## 🔧 Cài đặt

### Bước 1: Chạy Migration

#### Với Supabase:
```sql
-- Copy và chạy file migrations/003_add_user_permissions.sql
```

#### Với Prisma:
```bash
npx prisma db push
```

### Bước 2: Test API

```bash
# Xem quyền của user
GET /api/permissions/users/{userId}

# Cập nhật quyền đặc biệt
PUT /api/permissions/users/{userId}
{
  "grants": ["create_exams", "delete_tasks"],
  "denies": ["view_videos"],
  "reason": "Đặc cách cho Leader dự án A"
}

# Xóa tất cả quyền đặc biệt (reset về role)
DELETE /api/permissions/users/{userId}
```

## 💡 Các trường hợp sử dụng

### Case 1: Cấp quyền tạm thời

**Tình huống:** Leader cần quyền tạo bài thi trong 1 tháng

```json
{
  "grants": ["create_exams", "edit_exams"],
  "denies": [],
  "reason": "Đặc cách tháng 12/2024 - Phụ trách thi cuối kỳ"
}
```

### Case 2: Hạn chế quyền

**Tình huống:** Admin tập sự không được xóa dữ liệu

```json
{
  "grants": [],
  "denies": ["delete_exams", "delete_tasks", "delete_users"],
  "reason": "Admin tập sự - Chưa được quyền xóa"
}
```

### Case 3: Vai trò đặc biệt

**Tình huống:** User được phép quản lý video nhưng không phải leader

```json
{
  "grants": ["create_videos", "edit_videos", "delete_videos"],
  "denies": [],
  "reason": "Phụ trách mảng đào tạo video"
}
```

## 🎨 UI Quản lý (TODO)

Sẽ thêm vào **Settings > Phân quyền chi tiết**:

- Tab "Phân quyền theo User"
- Chọn user từ dropdown
- Hiển thị:
  - ✅ Quyền từ role (màu xanh)
  - ➕ Quyền được cấp thêm (màu vàng)
  - ⛔ Quyền bị gỡ bỏ (màu đỏ)
- Nút "Cấp quyền" / "Gỡ quyền" / "Reset về role"

## 📝 Ví dụ Code

### Backend: Check quyền

```typescript
import { hasUserPermission } from '@/lib/permissions'

// Kiểm tra quyền của user cụ thể (có tính UserPermission)
const canCreate = await hasUserPermission(
  userId,           // ID user
  userRole,         // Role của user
  'create_exams'    // Permission code
)
```

### API Route

```typescript
import { getJWT } from '@/lib/jwt'
import { hasUserPermission, PERMISSIONS } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  const user = await getJWT(request)
  
  // Check với UserPermission
  const canCreate = await hasUserPermission(
    user.userId,
    user.role,
    PERMISSIONS.CREATE_EXAMS
  )
  
  if (!canCreate) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }
  
  // ... logic tạo bài thi
}
```

## 🔍 Query hữu ích

### Xem tất cả user có quyền đặc biệt

```sql
SELECT 
  u.username,
  u."fullName",
  u.role,
  p.name as permission_name,
  up.type,
  up.reason,
  up."grantedBy",
  up."createdAt"
FROM "UserPermission" up
JOIN "User" u ON u.id = up."userId"
JOIN "Permission" p ON p.id = up."permissionId"
ORDER BY up."createdAt" DESC;
```

### Xem quyền hiệu lực của một user

```sql
-- Quyền từ role
SELECT 'role' as source, p.code, p.name
FROM "RolePermission" rp
JOIN "Permission" p ON p.id = rp."permissionId"
WHERE rp.role = (SELECT role FROM "User" WHERE id = 'user_id_here')

UNION

-- Quyền được cấp thêm
SELECT 'grant' as source, p.code, p.name
FROM "UserPermission" up
JOIN "Permission" p ON p.id = up."permissionId"
WHERE up."userId" = 'user_id_here' AND up.type = 'grant'

EXCEPT

-- Trừ đi quyền bị gỡ
SELECT 'deny' as source, p.code, p.name
FROM "UserPermission" up
JOIN "Permission" p ON p.id = up."permissionId"
WHERE up."userId" = 'user_id_here' AND up.type = 'deny';
```

## ⚠️ Lưu ý

1. **Deny > Grant**: Nếu một quyền vừa grant vừa deny, deny sẽ được ưu tiên
2. **Audit Trail**: Lưu lại người cấp quyền và lý do để audit
3. **Cleanup**: Nên định kỳ review và xóa quyền đặc biệt đã hết hạn
4. **Performance**: UserPermission được query trực tiếp, không cache (để realtime)

## 🚀 Roadmap

- [ ] UI quản lý UserPermission trong Settings
- [ ] Thêm expiry date cho quyền tạm thời
- [ ] Notification khi được cấp/gỡ quyền
- [ ] Audit log chi tiết
- [ ] Export danh sách user có quyền đặc biệt

