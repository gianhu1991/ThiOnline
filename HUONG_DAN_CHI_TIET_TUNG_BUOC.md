# 📖 Hướng dẫn Chi Tiết Từng Bước - Deploy lên Web

Hướng dẫn này sẽ hướng dẫn bạn **TỪNG BƯỚC MỘT**, không bỏ sót gì cả!

---

## ✅ BƯỚC 1: Đẩy Code lên GitHub (15 phút)

### Bước 1.1: Mở Terminal/Command Prompt

1. Nhấn phím **Windows** trên bàn phím
2. Gõ **"cmd"** hoặc **"PowerShell"**
3. Nhấn Enter để mở Command Prompt

### Bước 1.2: Di chuyển vào thư mục project

1. Trong Command Prompt, gõ lệnh sau:
```bash
cd C:\Users\Admin\Desktop\Thionline
```

2. Nhấn Enter
3. Bạn sẽ thấy đường dẫn hiển thị: `C:\Users\Admin\Desktop\Thionline>`

### Bước 1.3: Kiểm tra Git đã cài chưa

1. Gõ lệnh:
```bash
git --version
```

2. Nhấn Enter
3. Nếu thấy hiển thị số phiên bản (ví dụ: `git version 2.xx.x`) → ✅ Đã cài → **Bỏ qua Bước 1.3.1, tiếp tục Bước 1.4**

4. Nếu thấy lỗi **"git is not recognized"** → ⚠️ **Cần cài Git trước!**

### Bước 1.3.1: Cài đặt Git (Nếu chưa có)

⚠️ **QUAN TRỌNG:** Nếu bạn thấy lỗi "git is not recognized", làm theo các bước sau:

1. **Mở file `CAI_DAT_GIT.md`** trong thư mục project
2. Làm theo hướng dẫn trong file đó để cài Git
3. Sau khi cài xong, **mở Command Prompt mới** và quay lại đây
4. Thử lại lệnh `git --version` để kiểm tra

**Hoặc làm nhanh:**
- Vào: **https://git-scm.com/download/win**
- Tải file `.exe`
- Cài đặt (nhấn Next, Next, Next... đến hết)
- **Khởi động lại Command Prompt**
- Thử lại `git --version`

### Bước 1.4: Khởi tạo Git repository

1. Gõ lệnh:
```bash
git init
```

2. Nhấn Enter
3. Sẽ thấy thông báo: `Initialized empty Git repository...`

### Bước 1.5: Thêm tất cả file vào Git

1. Gõ lệnh:
```bash
git add .
```

2. Nhấn Enter
3. Không có thông báo gì là bình thường

### Bước 1.6: Tạo commit đầu tiên

1. Gõ lệnh:
```bash
git commit -m "Initial commit"
```

2. Nhấn Enter
3. Sẽ thấy thông báo về số file đã commit

### Bước 1.7: Tạo tài khoản GitHub (Nếu chưa có)

1. Mở trình duyệt
2. Vào: **https://github.com**
3. Nhấn **"Sign up"** (nếu chưa có tài khoản)
4. Điền thông tin:
   - Email
   - Password
   - Username
5. Xác nhận email
6. Đăng nhập vào GitHub

### Bước 1.8: Tạo Repository mới trên GitHub

1. Vào: **https://github.com/new**
2. Điền thông tin:
   - **Repository name**: `thionline` (hoặc tên bạn muốn)
   - **Description**: (Để trống hoặc gõ "Thi trắc nghiệm online")
   - **Public** hoặc **Private**: Chọn Public (miễn phí)
   - **KHÔNG TÍCH** "Add a README file"
   - **KHÔNG TÍCH** "Add .gitignore"
   - **KHÔNG TÍCH** "Choose a license"
3. Nhấn nút màu xanh **"Create repository"**

### Bước 1.9: Kết nối với GitHub repository

1. Quay lại Command Prompt
2. Gõ lệnh (thay `YOUR_USERNAME` bằng username GitHub của bạn):
```bash
git remote add origin https://github.com/YOUR_USERNAME/thionline.git
```

**Ví dụ:** Nếu username là `gianhu1991`, lệnh sẽ là:
```bash
git remote add origin https://github.com/gianhu1991/thionline.git
```

3. Nhấn Enter

### Bước 1.10: Đổi tên branch thành main

1. Gõ lệnh:
```bash
git branch -M main
```

2. Nhấn Enter

### Bước 1.11: Đẩy code lên GitHub

1. Gõ lệnh:
```bash
git push -u origin main
```

2. Nhấn Enter
3. GitHub sẽ yêu cầu đăng nhập:
   - Nếu hỏi username: Nhập username GitHub
   - Nếu hỏi password: Nhập password GitHub (hoặc Personal Access Token)
4. Đợi vài giây, sẽ thấy thông báo: `Writing objects: 100%`
5. ✅ **Xong!** Code đã được đẩy lên GitHub

### Bước 1.12: Kiểm tra

1. Vào: **https://github.com/YOUR_USERNAME/thionline**
2. Bạn sẽ thấy tất cả file code của bạn
3. ✅ **Hoàn thành Bước 1!**

---

## ✅ BƯỚC 2: Tạo Database trên Supabase (10 phút)

### Bước 2.1: Mở Supabase

1. Mở trình duyệt
2. Vào: **https://supabase.com**
3. Nhấn **"Start your project"** hoặc **"Sign Up"**

### Bước 2.2: Đăng ký tài khoản

1. Chọn **"Sign in with GitHub"** (khuyến nghị) hoặc đăng ký bằng email
2. Nếu chọn GitHub: Cho phép Supabase truy cập GitHub
3. Hoàn tất đăng ký

### Bước 2.3: Tạo Project mới

1. Sau khi đăng nhập, nhấn nút **"New Project"** (màu xanh)
2. Điền thông tin:
   - **Name**: `thionline`
   - **Database Password**: 
     - Tạo mật khẩu mạnh (ví dụ: `MyPassword123!@#`)
     - ⚠️ **QUAN TRỌNG:** Copy mật khẩu này vào Notepad, bạn sẽ cần dùng sau!
   - **Region**: Chọn **"Southeast Asia (Singapore)"** (gần Việt Nam nhất)
3. Nhấn nút **"Create new project"** (màu xanh)
4. Đợi 2-3 phút để Supabase tạo project

### Bước 2.4: Lấy Connection String

1. Sau khi project tạo xong, bạn sẽ thấy trang chủ project
2. Tìm phần **"Connect to your project"** hoặc **"Database"**
3. Click vào để xem connection string
4. Hoặc làm theo:
   - Click **⚙️ Settings** (góc dưới bên trái)
   - Chọn **"Database"** trong menu
   - Scroll xuống tìm **"Connection string"**
   - Chọn tab **"URI"**
5. Bạn sẽ thấy connection string có dạng:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.fqgnechgzwckonjyqifq.supabase.co:5432/postgres
   ```
6. **Copy** connection string này
7. **Thay** `[YOUR-PASSWORD]` bằng mật khẩu bạn đã tạo ở bước 2.3
   - Ví dụ: Mật khẩu là `MyPassword123!@#`
   - Connection string sau khi thay:
   ```
   postgresql://postgres:MyPassword123!@#@db.fqgnechgzwckonjyqifq.supabase.co:5432/postgres
   ```
8. **Lưu** connection string đã thay mật khẩu vào Notepad
9. ✅ **Hoàn thành Bước 2!**

---

## ✅ BƯỚC 3: Import Project vào Vercel (10 phút)

### Bước 3.1: Mở Vercel

1. Mở trình duyệt (tab mới)
2. Vào: **https://vercel.com**
3. Nhấn **"Sign Up"** hoặc **"Log In"**

### Bước 3.2: Đăng nhập Vercel

1. Chọn **"Continue with GitHub"** (khuyến nghị)
2. Cho phép Vercel truy cập GitHub
3. Hoàn tất đăng nhập

### Bước 3.3: Import Project

1. Sau khi đăng nhập, bạn sẽ thấy trang dashboard
2. Tìm phần **"Dự án nhập khẩu"** (Import Project) hoặc nút **"Add New..."**
3. Nhấn **"Import"** hoặc **"Nhập khẩu"**
4. Vercel sẽ hiển thị danh sách repository từ GitHub
5. Tìm và chọn repository **"thionline"** (hoặc tên bạn đã đặt)
6. Nhấn **"Import"**

### Bước 3.4: Cấu hình Project

1. Vercel sẽ tự động detect Next.js
2. **KHÔNG CẦN** thay đổi gì, để mặc định:
   - **Project Name**: `thionline` (hoặc để mặc định)
   - **Framework Preset**: Next.js (tự động)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
3. Scroll xuống tìm phần **"Environment Variables"**

### Bước 3.5: Thêm Environment Variable

1. Trong phần **"Environment Variables"**, nhấn **"Add"** hoặc **"Thêm"**
2. Điền thông tin:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste connection string đã lưu ở Bước 2.4 (đã thay mật khẩu)
   - Tích chọn tất cả: **Production**, **Preview**, **Development**
3. Nhấn **"Save"** hoặc **"Lưu"**
4. ✅ Biến môi trường đã được thêm

### Bước 3.6: Deploy Project

1. Scroll xuống cuối trang
2. Nhấn nút **"Deploy"** (màu xanh)
3. Đợi Vercel build và deploy (2-5 phút)
4. Bạn sẽ thấy tiến trình build:
   - "Installing dependencies..."
   - "Building..."
   - "Deploying..."
5. Khi xong, bạn sẽ thấy **"Congratulations!"** và một URL
6. URL sẽ có dạng: `https://thionline.vercel.app`
7. ✅ **Hoàn thành Bước 3!**

---

## ✅ BƯỚC 4: Chạy Migration Database (5 phút)

### Bước 4.1: Mở Supabase SQL Editor

1. Quay lại Supabase (tab đã mở trước đó)
2. Ở menu bên trái, tìm và click **"SQL Editor"**
3. Hoặc vào: **Settings** → **SQL Editor**

### Bước 4.2: Mở file migrations.sql

1. Quay lại thư mục project trên máy tính
2. Mở file: `prisma/migrations.sql`
3. **Copy toàn bộ** nội dung trong file (Ctrl+A, Ctrl+C)

### Bước 4.3: Chạy SQL trong Supabase

1. Quay lại Supabase SQL Editor
2. **Paste** nội dung SQL vừa copy vào ô editor (Ctrl+V)
3. Nhấn nút **"Run"** hoặc **"RUN"** (màu xanh, góc dưới bên phải)
4. Đợi vài giây
5. Bạn sẽ thấy thông báo: **"Success. No rows returned"** hoặc tương tự
6. ✅ **Hoàn thành Bước 4!**

---

## ✅ BƯỚC 5: Kiểm tra Website (2 phút)

### Bước 5.1: Mở Website

1. Quay lại Vercel
2. Copy URL của website (ví dụ: `https://thionline.vercel.app`)
3. Mở tab mới, paste URL và Enter
4. Website sẽ hiển thị!

### Bước 5.2: Test các chức năng

1. **Trang chủ**: Kiểm tra có hiển thị không
2. **Ngân hàng câu hỏi**: 
   - Click vào "Ngân hàng câu hỏi"
   - Thử import một file Excel mẫu
3. **Tạo bài thi**:
   - Click "Tạo bài thi"
   - Điền thông tin và tạo bài thi
4. **Làm bài thi**:
   - Vào "Quản lý bài thi"
   - Chọn bài thi và "Làm bài"

### Bước 5.3: Hoàn thành!

✅ **Website của bạn đã hoạt động trên internet!**

---

## 🆘 Xử lý lỗi thường gặp

### Lỗi: "git is not recognized"
**Giải pháp:** Cài Git từ https://git-scm.com/download/win

### Lỗi: "Repository not found" khi push
**Giải pháp:** 
- Kiểm tra username GitHub đúng chưa
- Kiểm tra repository đã được tạo trên GitHub chưa

### Lỗi: "Database connection failed" trên website
**Giải pháp:**
- Kiểm tra `DATABASE_URL` trong Vercel Environment Variables
- Đảm bảo đã thay `[YOUR-PASSWORD]` bằng mật khẩu thực tế
- Kiểm tra connection string có đúng format không

### Lỗi: "Table does not exist"
**Giải pháp:**
- Quay lại Bước 4, chạy lại SQL migration
- Hoặc kiểm tra xem SQL đã chạy thành công chưa

### Website không load được
**Giải pháp:**
- Kiểm tra deployment status trên Vercel
- Xem logs trong Vercel Dashboard → Deployments → Logs
- Đảm bảo build đã thành công

---

## 📞 Cần giúp đỡ?

Nếu gặp vấn đề ở bước nào, hãy cho tôi biết:
- Bạn đang ở bước nào?
- Lỗi cụ thể là gì?
- Screenshot (nếu có)

**Chúc bạn thành công! 🎉**

