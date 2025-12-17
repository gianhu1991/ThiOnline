# Hướng dẫn setup hệ thống phân quyền chi tiết

Hệ thống đã được nâng cấp với bảng phân quyền chi tiết, cho phép quản lý quyền linh hoạt cho từng vai trò (role).

## Các bước thực hiện

### 1. Push migration để tạo bảng mới

```bash
npx prisma db push
```

Lệnh này sẽ tạo 2 bảng mới:
- `Permission`: Lưu các quyền trong hệ thống
- `RolePermission`: Map quyền với vai trò

### 2. Chạy script seed để tạo permissions mặc định

```bash
npx ts-node prisma/seed-permissions.ts
```

Script này sẽ:
- Tạo tất cả permissions (exams, tasks, users, videos, documents, system)
- Gán quyền mặc định cho các role:
  - **Admin**: Toàn quyền (tất cả permissions)
  - **Leader**: Chỉ xem và xuất báo cáo
  - **User**: Chỉ xem video và tài liệu

### 3. Cấu hình bổ sung (optional)

Sau khi seed, bạn có thể vào **Settings > Phân quyền chi tiết** để:
- Xem và chỉnh sửa quyền cho từng role
- Tùy chỉnh quyền của Leader hoặc tạo role mới

## Cấu trúc permissions

### Danh mục quyền

#### Bài thi (Exams)
- `view_exams`: Xem danh sách bài thi
- `create_exams`: Tạo bài thi mới
- `edit_exams`: Chỉnh sửa bài thi
- `delete_exams`: Xóa bài thi
- `export_exam_results`: Xuất kết quả ra Excel
- `assign_exams`: Gán bài thi cho người dùng
- `toggle_exam_status`: Bật/tắt bài thi
- `view_exam_results`: Xem kết quả bài thi

#### Nhiệm vụ (Tasks)
- `view_tasks`: Xem danh sách nhiệm vụ
- `create_tasks`: Tạo nhiệm vụ mới
- `edit_tasks`: Chỉnh sửa nhiệm vụ
- `delete_tasks`: Xóa nhiệm vụ
- `export_task_results`: Xuất kết quả ra Excel
- `assign_tasks`: Gán nhiệm vụ
- `upload_task_data`: Upload dữ liệu Excel
- `view_task_customers`: Xem danh sách khách hàng

#### Câu hỏi (Questions)
- `view_questions`: Xem ngân hàng câu hỏi
- `create_questions`: Tạo câu hỏi mới
- `edit_questions`: Chỉnh sửa câu hỏi
- `delete_questions`: Xóa câu hỏi
- `import_questions`: Import câu hỏi từ Excel

#### Người dùng (Users)
- `view_users`: Xem danh sách người dùng
- `create_users`: Tạo người dùng mới
- `edit_users`: Chỉnh sửa người dùng
- `delete_users`: Xóa người dùng

#### Video & Tài liệu
- `view_videos`, `create_videos`, `edit_videos`, `delete_videos`
- `view_documents`, `create_documents`, `edit_documents`, `delete_documents`

#### Hệ thống (System)
- `manage_categories`: Quản lý lĩnh vực
- `manage_groups`: Quản lý nhóm người dùng
- `manage_settings`: Quản lý cài đặt
- `manage_permissions`: Quản lý phân quyền

## Cách sử dụng trong code

### Kiểm tra permission trong API routes

```typescript
import { getJWT } from '@/lib/jwt'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  const user = await getJWT(request)
  
  // Kiểm tra quyền tạo bài thi
  const canCreate = await hasPermission(user.role, PERMISSIONS.CREATE_EXAMS)
  if (!canCreate) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }
  
  // ... logic tạo bài thi
}
```

### Kiểm tra permission trong frontend

```typescript
import { PERMISSIONS } from '@/lib/permissions'

// Fetch permissions của user từ API
const fetchUserPermissions = async () => {
  const res = await fetch(`/api/permissions/roles/${userRole}`)
  const data = await res.json()
  setUserPermissions(data.permissions)
}

// Kiểm tra và hiển thị UI
{userPermissions.includes(PERMISSIONS.CREATE_EXAMS) && (
  <button>Tạo bài thi</button>
)}
```

## Ưu điểm của hệ thống mới

1. **Linh hoạt**: Dễ dàng thêm/bớt quyền cho role mà không cần sửa code
2. **Quản lý tập trung**: UI quản lý phân quyền trực quan trong Settings
3. **Mở rộng**: Dễ dàng thêm role mới hoặc permissions mới
4. **Performance**: Cache permissions trong memory, giảm query database
5. **Audit**: Có thể track được ai có quyền gì, khi nào

## Migration từ hệ thống cũ

Hệ thống mới vẫn giữ nguyên trường `role` trong bảng `User`, tương thích ngược với code cũ. Các API đã được cập nhật để check permissions thay vì chỉ check role.

## Lưu ý

- Sau khi thay đổi permissions, cache sẽ tự động invalidate
- Cache có TTL 5 phút, sau đó sẽ tự động reload
- Super Admin vẫn có thể bypass permissions nếu cần

