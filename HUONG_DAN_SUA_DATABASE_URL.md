# 🔧 Hướng dẫn Sửa DATABASE_URL cho Vercel

## ⚠️ Vấn đề hiện tại
Vercel không thể kết nối database vì đang dùng Direct Connection (port 5432). Vercel cần **Connection Pooling** (port 6543).

---

## 📍 Bước 1: Lấy Connection Pooling URL từ Supabase

### 1.1. Vào Supabase Dashboard
1. Truy cập: **https://supabase.com/dashboard**
2. Đăng nhập
3. Chọn **project** của bạn

### 1.2. Lấy Connection Pooling URL
1. Click **⚙️ Settings** (góc dưới bên trái)
2. Chọn **"Database"**
3. Scroll xuống tìm phần **"Connection string"** hoặc **"Connection pooling"**
4. Tìm tab **"Connection pooling"** hoặc **"Session mode"**
5. Copy connection string có **port 6543** (KHÔNG phải 5432)

**Format sẽ giống:**
```
postgresql://postgres.fqgnechgzwckonjyqifq:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Hoặc nếu không có pooling, dùng format này:**
```
postgresql://postgres:[PASSWORD]@db.fqgnechgzwckonjyqifq.supabase.co:5432/postgres?connection_limit=1
```

---

## 📍 Bước 2: Tạo Connection String với Pooling

Nếu không thấy pooling URL, tự tạo như sau:

### Thông tin của bạn:
- Reference ID: `fqgnechgzwckonjyqifq`
- Password: `Nhuchi@0105`

### Connection String với Pooling (Khuyến nghị):
```
postgresql://postgres.fqgnechgzwckonjyqifq:Nhuchi%400105@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Lưu ý:**
- `@` trong mật khẩu phải encode thành `%40`
- Port là **6543** (pooling), không phải 5432
- Host là `aws-0-[REGION].pooler.supabase.com` (không phải `db.xxx.supabase.co`)

### Nếu không có pooling, dùng Direct với connection_limit:
```
postgresql://postgres:Nhuchi%400105@db.fqgnechgzwckonjyqifq.supabase.co:5432/postgres?connection_limit=1
```

---

## 📍 Bước 3: Cập nhật trong Vercel

### 3.1. Vào Vercel Dashboard
1. Truy cập: **https://vercel.com/dashboard**
2. Chọn project **thi-online-beta** (hoặc tên project của bạn)

### 3.2. Cập nhật Environment Variable
1. Click tab **Settings**
2. Click **Environment Variables** ở menu bên trái
3. Tìm biến **`DATABASE_URL`**
4. Click **Edit**
5. Paste connection string mới (từ Bước 2)
6. Chọn môi trường: **Production**, **Preview**, **Development** (chọn cả 3)
7. Click **Save**

### 3.3. Redeploy
1. Vào tab **Deployments**
2. Tìm deployment mới nhất
3. Click **...** (3 chấm) → **Redeploy**
4. Đợi 2-3 phút

---

## 📍 Bước 4: Kiểm tra

### 4.1. Kiểm tra DATABASE_URL
Sau khi deploy xong, mở:
```
https://thi-online-beta.vercel.app/debug-db
```

Kiểm tra:
- ✅ DATABASE_URL có tồn tại
- ✅ Format đúng (bắt đầu bằng `postgresql://`)
- ✅ Port là 6543 (pooling) hoặc 5432 với `connection_limit=1`

### 4.2. Thử Init Admin
Mở:
```
https://thi-online-beta.vercel.app/init-admin
```

Nhấn **"Tạo User Admin"**. Nếu thành công → ✅ Hoàn tất!

---

## 🆘 Vẫn lỗi?

### Kiểm tra lại:
1. Connection string có đúng format không?
2. Mật khẩu có ký tự đặc biệt → đã encode chưa? (`@` → `%40`)
3. Đã chọn đúng môi trường trong Vercel? (Production, Preview, Development)
4. Đã Redeploy sau khi sửa chưa?

### Thử Connection String khác:
Nếu pooling không hoạt động, thử direct với `connection_limit=1`:
```
postgresql://postgres:Nhuchi%400105@db.fqgnechgzwckonjyqifq.supabase.co:5432/postgres?connection_limit=1
```

---

## 💡 Mẹo

- **Connection Pooling** (port 6543): Tốt cho Vercel, hỗ trợ nhiều connection
- **Direct Connection** (port 5432): Cần thêm `?connection_limit=1` để tránh quá tải
- Luôn encode ký tự đặc biệt trong mật khẩu: `@` → `%40`, `#` → `%23`, v.v.

