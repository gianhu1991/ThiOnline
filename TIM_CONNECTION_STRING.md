# 🔍 Cách Tìm Connection String trong Supabase

Nếu bạn không thấy phần "Connection string" trong Supabase, đây là các cách để tìm:

## 📍 Vị trí 1: Settings → Database

1. Click **⚙️ Settings** (góc dưới bên trái)
2. Chọn **"Database"** trong menu
3. Scroll xuống tìm:
   - **"Connection string"**
   - **"Connection info"** 
   - **"Connection pooling"**

## 📍 Vị trí 2: Project Settings

1. Click vào **tên project** ở góc trên bên trái
2. Hoặc vào **⚙️ Settings** → **General**
3. Tìm tab **"Database"** hoặc **"Connection"**

## 📍 Vị trí 3: API Settings

1. Vào **⚙️ Settings** → **API**
2. Tìm phần **"Database"** hoặc **"Connection string"**

## 🛠️ Tự Tạo Connection String

Nếu vẫn không tìm thấy, bạn có thể tự tạo:

### Bước 1: Lấy thông tin cần thiết

1. Vào **Settings** → **General**
2. Tìm **"Reference ID"** (ví dụ: `abcdefghijklmnop`)
3. Nhớ **mật khẩu database** bạn đã tạo khi tạo project

### Bước 2: Tạo Connection String

Format chuẩn:
```
postgresql://postgres:[PASSWORD]@db.[REFERENCE-ID].supabase.co:5432/postgres
```

**Ví dụ:**
- Reference ID: `abcdefghijklmnop`
- Password: `MyPassword123!`
- Connection string:
```
postgresql://postgres:MyPassword123!@db.abcdefghijklmnop.supabase.co:5432/postgres
```

### Bước 3: Kiểm tra

1. Copy connection string vừa tạo
2. Test bằng cách tạo file `.env.local`:
```env
DATABASE_URL="postgresql://postgres:MyPassword123!@db.abcdefghijklmnop.supabase.co:5432/postgres"
```

3. Chạy:
```bash
npx prisma db push
```

Nếu không có lỗi → Connection string đúng! ✅

## 💡 Mẹo

- Connection string thường bắt đầu bằng `postgresql://` hoặc `postgres://`
- Port thường là `5432` (direct) hoặc `6543` (pooling)
- Host thường có dạng `db.xxxxx.supabase.co` hoặc `aws-0-xxxxx.pooler.supabase.com`

## ❓ Vẫn không tìm thấy?

1. Đảm bảo project đã được tạo xong (đợi 2-3 phút)
2. Refresh trang (F5)
3. Thử đăng xuất và đăng nhập lại
4. Kiểm tra xem bạn có quyền truy cập project không

