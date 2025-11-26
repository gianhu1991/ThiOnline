# 🔗 Hướng dẫn Lấy Connection String từ Supabase

## ⚠️ QUAN TRỌNG: Bạn đang ở Vercel, cần vào Supabase!

Nếu bạn đang thấy giao diện Vercel (có "ThiOnline / main Production"), bạn cần **vào Supabase** để lấy connection string.

---

## 📍 Cách 1: Vào Supabase để lấy Connection String

### Bước 1: Mở Supabase
1. Truy cập: **https://supabase.com**
2. Đăng nhập bằng tài khoản bạn đã tạo
3. Vào **project** bạn đã tạo (nếu chưa tạo, xem bước 2)

### Bước 2: Tạo Project (Nếu chưa có)
1. Nhấn **"New Project"**
2. Điền thông tin:
   - Name: `thionline`
   - Database Password: Tạo mật khẩu mạnh (⚠️ **LƯU LẠI**)
   - Region: Chọn gần Việt Nam (ví dụ: Singapore)
3. Nhấn **"Create new project"**
4. Đợi 2-3 phút

### Bước 3: Lấy Connection String

**Cách A: Từ trang chủ Project**
1. Vào project vừa tạo
2. Ở trang chủ, tìm phần **"Connection string"** hoặc **"Database"**
3. Click vào để xem connection string

**Cách B: Từ Settings**
1. Click **⚙️ Settings** (góc dưới bên trái)
2. Chọn **"Database"**
3. Scroll xuống tìm **"Connection string"** hoặc **"Connection info"**
4. Copy connection string

**Cách C: Tự tạo từ thông tin có sẵn**

Nếu không thấy connection string sẵn có, làm theo:

1. Vào **Settings** → **General**
2. Tìm **"Reference ID"** (ví dụ: `abcdefghijklmnop`)
3. Nhớ **mật khẩu database** bạn đã tạo
4. Tạo connection string theo format:
   ```
   postgresql://postgres:[MẬT-KHẨU]@db.[REFERENCE-ID].supabase.co:5432/postgres
   ```

**Ví dụ:**
- Reference ID: `abcdefghijklmnop`
- Password: `MyPassword123!`
- Connection string:
   ```
   postgresql://postgres:MyPassword123!@db.abcdefghijklmnop.supabase.co:5432/postgres
   ```

---

## 📍 Cách 2: Tìm Reference ID trong Supabase

1. Vào **Settings** → **General**
2. Tìm **"Reference ID"** hoặc **"Project Reference"**
3. Hoặc xem trong URL: `https://supabase.com/dashboard/project/[REFERENCE-ID]`

---

## ✅ Sau khi có Connection String

1. **Copy** connection string
2. Vào **Vercel** → **Project Settings** → **Environment Variables**
3. Thêm biến:
   - Name: `DATABASE_URL`
   - Value: Paste connection string
4. Save và Redeploy

---

## 🆘 Vẫn không tìm thấy?

Nếu bạn chưa tạo project trên Supabase:
1. Vào https://supabase.com
2. Đăng ký/Đăng nhập
3. Tạo project mới
4. Lấy connection string

Nếu đã có project nhưng không thấy connection string:
- Thử refresh trang (F5)
- Thử đăng xuất và đăng nhập lại
- Kiểm tra xem project đã được tạo xong chưa (đợi 2-3 phút)

---

## 📸 Hình ảnh tham khảo

Connection string trong Supabase thường có dạng:
```
postgresql://postgres.xxxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

Hoặc:
```
postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

