# Hướng dẫn Triển khai cho Nhiều Đơn vị Độc lập

## Tổng quan

Tài liệu này hướng dẫn cách triển khai hệ thống thi online cho nhiều đơn vị độc lập. Có 3 phương án chính:

## Phương án 1: Deploy Riêng biệt (Khuyến nghị cho bắt đầu)

### Ưu điểm
- ✅ Tách biệt hoàn toàn dữ liệu giữa các đơn vị
- ✅ Dễ bảo trì và quản lý
- ✅ Không ảnh hưởng lẫn nhau khi có sự cố
- ✅ Dễ tùy chỉnh cho từng đơn vị
- ✅ Bảo mật tốt hơn

### Nhược điểm
- ❌ Tốn tài nguyên hơn (nhiều server/database)
- ❌ Cần quản lý nhiều instance

### Các bước triển khai

#### 1. Chuẩn bị môi trường cho mỗi đơn vị

```bash
# Tạo thư mục riêng cho đơn vị mới
mkdir thionline-unit2
cd thionline-unit2

# Clone hoặc copy codebase
cp -r ../Thionline/* .

# Hoặc clone từ git repository
git clone <your-repo-url> .
```

#### 2. Tạo database riêng

Mỗi đơn vị cần có database PostgreSQL riêng:

```bash
# Tạo file .env cho đơn vị mới
DATABASE_URL="postgresql://user:password@localhost:5432/thionline_unit2"
JWT_SECRET="unique-secret-key-for-unit2"
NODE_ENV="production"
```

#### 3. Khởi tạo database

```bash
# Chạy migration
npm run db:push

# Tạo admin user
npm run init:admin
```

#### 4. Deploy

**Với Vercel:**
- Tạo project mới trên Vercel
- Connect với repository riêng hoặc branch riêng
- Set environment variables (DATABASE_URL, JWT_SECRET)
- Deploy

**Với server riêng:**
```bash
# Build
npm run build

# Start
npm start
```

#### 5. Cấu hình domain

- Đơn vị 1: `thionline1.yourdomain.com`
- Đơn vị 2: `thionline2.yourdomain.com`
- Hoặc dùng domain hoàn toàn khác nhau

---

## Phương án 2: Multi-Tenancy với Organization Model (Khuyến nghị cho mở rộng)

### Ưu điểm
- ✅ Chia sẻ tài nguyên (1 server, 1 database)
- ✅ Dễ mở rộng thêm đơn vị mới
- ✅ Quản lý tập trung
- ✅ Tiết kiệm chi phí

### Nhược điểm
- ❌ Cần refactor code nhiều
- ❌ Phức tạp hơn trong quản lý
- ❌ Cần đảm bảo data isolation tốt

### Các bước triển khai

#### Bước 1: Cập nhật Database Schema

Thêm model Organization và liên kết với các model khác:

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  subdomain   String   @unique // Ví dụ: unit1, unit2
  domain      String?  // Domain tùy chỉnh (optional)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  users       User[]
  exams       Exam[]
  questions   Question[]
  videos      Video[]
  documents   Document[]
  categories  Category[]
  userGroups  UserGroup[]
  settings    Settings[]
}

// Cập nhật các model hiện có để thêm organizationId
model User {
  // ... existing fields
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

model Exam {
  // ... existing fields
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

// Tương tự cho Question, Video, Document, Category, UserGroup, Settings
```

#### Bước 2: Tạo Migration Script

Tạo file migration để thêm Organization và cập nhật các bảng hiện có.

#### Bước 3: Cập nhật Authentication

- Thêm organizationId vào JWT token
- Xác định organization từ subdomain hoặc domain
- Filter tất cả queries theo organizationId

#### Bước 4: Cập nhật API Routes

Tất cả API routes cần:
- Lấy organizationId từ JWT hoặc request
- Filter data theo organizationId
- Đảm bảo user chỉ truy cập được data của organization mình

#### Bước 5: Cập nhật Middleware

Middleware cần xác định organization từ:
- Subdomain: `unit1.yourdomain.com`
- Domain: `unit1domain.com`
- Hoặc từ JWT token

---

## Phương án 3: Sử dụng UserGroup như Organization (Không khuyến nghị)

### Mô tả
Sử dụng UserGroup hiện có để tách biệt đơn vị, nhưng cách này không đảm bảo data isolation hoàn toàn.

### Hạn chế
- ❌ Không tách biệt được Questions, Settings
- ❌ Admin có thể thấy data của tất cả đơn vị
- ❌ Khó quản lý và bảo mật

---

## So sánh các phương án

| Tiêu chí | Deploy Riêng | Multi-Tenancy | UserGroup |
|----------|-------------|---------------|-----------|
| Độ phức tạp | ⭐ Thấp | ⭐⭐⭐ Cao | ⭐⭐ Trung bình |
| Chi phí | ⭐⭐⭐ Cao | ⭐ Thấp | ⭐ Thấp |
| Bảo mật | ⭐⭐⭐ Rất tốt | ⭐⭐ Tốt | ⭐ Kém |
| Dễ mở rộng | ⭐⭐ Trung bình | ⭐⭐⭐ Rất dễ | ⭐⭐ Trung bình |
| Tách biệt dữ liệu | ⭐⭐⭐ Hoàn toàn | ⭐⭐ Logic | ⭐ Một phần |

---

## Khuyến nghị

### Nếu bạn có:
- **< 3 đơn vị**: Chọn **Phương án 1** (Deploy riêng)
- **3-10 đơn vị**: Chọn **Phương án 2** (Multi-tenancy)
- **> 10 đơn vị**: Chắc chắn chọn **Phương án 2** (Multi-tenancy)

### Nếu bạn cần:
- **Tách biệt hoàn toàn**: Chọn **Phương án 1**
- **Tiết kiệm chi phí**: Chọn **Phương án 2**
- **Triển khai nhanh**: Chọn **Phương án 1** (copy code và deploy)

---

## Bước tiếp theo

Sau khi chọn phương án, bạn có thể:
1. Yêu cầu tôi tạo migration script cho Phương án 2
2. Yêu cầu tôi tạo deployment script cho Phương án 1
3. Yêu cầu tôi implement đầy đủ Phương án 2

