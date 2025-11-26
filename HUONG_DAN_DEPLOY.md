# 🚀 Hướng dẫn Deploy lên Web - Từng bước chi tiết

Hướng dẫn này sẽ giúp bạn deploy phần mềm thi trắc nghiệm lên web **HOÀN TOÀN MIỄN PHÍ** sử dụng **Vercel + Supabase**.

---

## 📋 Bước 1: Tạo Database trên Supabase (5 phút)

### 1.1. Tạo tài khoản Supabase
1. Truy cập: https://supabase.com
2. Nhấn **"Start your project"** hoặc **"Sign Up"**
3. Đăng ký bằng GitHub (khuyến nghị) hoặc email

### 1.2. Tạo Project mới
1. Sau khi đăng nhập, nhấn **"New Project"**
2. Điền thông tin:
   - **Name**: `thionline` (hoặc tên bạn muốn)
   - **Database Password**: Tạo mật khẩu mạnh (⚠️ **LƯU LẠI MẬT KHẨU NÀY**)
   - **Region**: Chọn gần Việt Nam nhất (ví dụ: `Southeast Asia (Singapore)`)
3. Nhấn **"Create new project"**
4. Đợi 2-3 phút để Supabase tạo project

### 1.3. Lấy Connection String

⚠️ **QUAN TRỌNG:** Bạn cần vào **Supabase** (KHÔNG phải Vercel) để lấy connection string!

#### Bước 1: Mở Supabase
1. Mở tab mới trong trình duyệt
2. Truy cập: **https://supabase.com**
3. Đăng nhập bằng tài khoản bạn đã tạo ở bước 1.1
4. Vào **project** bạn đã tạo (nếu chưa tạo, quay lại bước 1.2)

#### Bước 2: Tìm Connection String

**Cách A: Từ trang chủ Project (Dễ nhất)**
1. Vào project của bạn
2. Ở trang chủ, tìm card **"Connect to your project"** hoặc **"Database"**
3. Click vào để xem connection string
4. Copy connection string

**Cách B: Từ Settings → Database**
1. Click **⚙️ Settings** (góc dưới bên trái)
2. Chọn **"Database"** trong menu
3. Scroll xuống tìm phần **"Connection string"**
4. Chọn tab **"URI"** hoặc **"Connection string"**
5. Copy connection string

**Cách C: Tự tạo (Nếu không thấy sẵn)**

Nếu không thấy connection string sẵn có:

1. Vào **Settings** → **General**
2. Tìm **"Reference ID"** (ví dụ: `abcdefghijklmnop`)
   - Hoặc xem trong URL: `supabase.com/dashboard/project/[REFERENCE-ID]`
3. Nhớ **mật khẩu database** bạn đã tạo ở bước 1.2
4. Tạo connection string theo format:
   ```
   postgresql://postgres:[MẬT-KHẨU]@db.[REFERENCE-ID].supabase.co:5432/postgres
   ```
   
   **Ví dụ cụ thể:**
   - Reference ID: `abcdefghijklmnop`
   - Password: `MyPassword123!`
   - Connection string:
   ```
   postgresql://postgres:MyPassword123!@db.abcdefghijklmnop.supabase.co:5432/postgres
   ```

#### Bước 3: Lưu Connection String
- **LƯU LẠI** connection string này vào Notepad hoặc file text
- Bạn sẽ cần dùng ở bước 4.4 khi deploy lên Vercel

---

## 📦 Bước 2: Chuẩn bị Code (2 phút)

### 2.1. Kiểm tra code đã sẵn sàng
Đảm bảo bạn đã có các file:
- ✅ `package.json`
- ✅ `prisma/schema.prisma`
- ✅ `vercel.json`
- ✅ Tất cả các file trong thư mục `app/`

### 2.2. Tạo file .env.local (tùy chọn - chỉ để test local)
Tạo file `.env.local` trong thư mục gốc:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```
(Thay `YOUR_PASSWORD` và `xxxxx` bằng thông tin thực tế)

---

## 🔧 Bước 3: Chạy Migration Database (3 phút)

### 3.1. Cài đặt dependencies (nếu chưa cài)
```bash
npm install
```

### 3.2. Chạy migration để tạo bảng trong database
```bash
npx prisma db push
```

Bạn sẽ thấy output như:
```
✔ Generated Prisma Client
✔ Pushed database schema to Supabase
```

✅ **Nếu thành công**: Database đã sẵn sàng!

---

## 🚀 Bước 4: Deploy lên Vercel (10 phút)

### 4.1. Tạo tài khoản Vercel
1. Truy cập: https://vercel.com
2. Nhấn **"Sign Up"**
3. Đăng ký bằng GitHub (khuyến nghị - dễ nhất)

### 4.2. Đẩy code lên GitHub

**Nếu bạn chưa có GitHub repository:**

1. Tạo repository mới trên GitHub:
   - Vào https://github.com/new
   - Đặt tên: `thionline` (hoặc tên bạn muốn)
   - Chọn **Public** hoặc **Private**
   - Nhấn **"Create repository"**

2. Đẩy code lên GitHub:
```bash
# Trong thư mục dự án của bạn
git init
git add .
git commit -m "Initial commit - Thi trắc nghiệm online"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/thionline.git
git push -u origin main
```
(Thay `YOUR_USERNAME` bằng username GitHub của bạn)

**Nếu bạn đã có GitHub repository:**
```bash
git add .
git commit -m "Ready for deployment"
git push
```

### 4.3. Deploy trên Vercel

1. Vào https://vercel.com/dashboard
2. Nhấn **"Add New..."** → **"Project"**
3. Chọn repository `thionline` vừa push lên GitHub
4. Vercel sẽ tự động detect Next.js, nhấn **"Deploy"**

### 4.4. Thêm biến môi trường DATABASE_URL

**QUAN TRỌNG:** Bạn phải thêm biến môi trường trước khi deploy xong!

1. Trong trang deploy, click vào **"Environment Variables"**
2. Thêm biến môi trường:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste connection string từ Supabase (bước 1.3)
   - Chọn tất cả các môi trường: Production, Preview, Development
3. Nhấn **"Save"**

### 4.5. Chạy lại deployment

1. Vào **"Deployments"** tab
2. Click vào deployment mới nhất
3. Click **"Redeploy"** (để áp dụng biến môi trường)

Hoặc đơn giản hơn:
1. Vào **Settings** → **Environment Variables**
2. Đảm bảo `DATABASE_URL` đã được thêm
3. Vào **Deployments** → Click **"..."** → **"Redeploy"**

### 4.6. Chạy migration trên production

Sau khi deploy xong, bạn cần chạy migration một lần nữa:

**Cách 1: Dùng Vercel CLI (Khuyến nghị)**
```bash
# Cài Vercel CLI
npm i -g vercel

# Login
vercel login

# Link với project
vercel link

# Pull environment variables
vercel env pull .env.production

# Chạy migration
npx prisma db push
```

**Cách 2: Dùng Supabase SQL Editor**
1. Vào Supabase → SQL Editor
2. Chạy lệnh sau (copy từ file `prisma/schema.prisma`):
```sql
-- Tạo bảng Question
CREATE TABLE IF NOT EXISTS "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "correctAnswers" TEXT NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Tạo bảng Exam
CREATE TABLE IF NOT EXISTS "Exam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questionCount" INTEGER NOT NULL,
    "timeLimit" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleAnswers" BOOLEAN NOT NULL DEFAULT false,
    "maxAttempts" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Tạo bảng ExamQuestion
CREATE TABLE IF NOT EXISTS "ExamQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE,
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE,
    UNIQUE("examId", "questionId")
);

CREATE INDEX IF NOT EXISTS "ExamQuestion_examId_idx" ON "ExamQuestion"("examId");

-- Tạo bảng ExamResult
CREATE TABLE IF NOT EXISTS "ExamResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "studentName" TEXT,
    "studentId" TEXT,
    "score" REAL NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "answers" TEXT NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ExamResult_examId_idx" ON "ExamResult"("examId");
```

3. Nhấn **"Run"**

---

## ✅ Bước 5: Kiểm tra (2 phút)

1. Vào URL mà Vercel cung cấp (ví dụ: `https://thionline.vercel.app`)
2. Kiểm tra các trang:
   - ✅ Trang chủ hiển thị
   - ✅ Vào "Ngân hàng câu hỏi" → Thử import 1 file Excel mẫu
   - ✅ Tạo bài thi mới
   - ✅ Làm bài thi

---

## 🎉 Hoàn thành!

Bây giờ bạn đã có:
- ✅ Website chạy trên internet (URL công khai)
- ✅ Database lưu trữ trên Supabase
- ✅ Tự động deploy khi push code lên GitHub

---

## 🔄 Cập nhật code sau này

Mỗi khi bạn thay đổi code:
```bash
git add .
git commit -m "Update code"
git push
```

Vercel sẽ **tự động deploy** code mới!

---

## ❓ Xử lý lỗi thường gặp

### Lỗi: "Prisma Client has not been generated"
```bash
npx prisma generate
```

### Lỗi: "Database connection failed"
- Kiểm tra `DATABASE_URL` trong Vercel Environment Variables
- Đảm bảo đã thay `[YOUR-PASSWORD]` bằng mật khẩu thực tế
- Kiểm tra Supabase project vẫn đang hoạt động

### Lỗi: "Table does not exist"
- Chạy lại migration: `npx prisma db push`
- Hoặc tạo bảng thủ công trong Supabase SQL Editor

### Website không load được
- Kiểm tra deployment status trên Vercel
- Xem logs trong Vercel Dashboard → Deployments → Logs

---

## 📞 Cần giúp đỡ?

Nếu gặp vấn đề, kiểm tra:
1. ✅ Database connection string đúng chưa?
2. ✅ Environment variables đã được thêm vào Vercel chưa?
3. ✅ Migration đã chạy chưa?
4. ✅ Code đã push lên GitHub chưa?

**Chúc bạn thành công! 🎊**

