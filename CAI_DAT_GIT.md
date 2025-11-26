# 🔧 Hướng dẫn Cài Đặt Git trên Windows

## Bước 1: Tải Git

1. Mở trình duyệt
2. Vào: **https://git-scm.com/download/win**
3. Trang sẽ tự động detect Windows và hiển thị nút download
4. Nhấn nút **"Download"** (màu xanh)
5. File sẽ được tải về (tên file: `Git-2.xx.x-64-bit.exe`)

## Bước 2: Cài đặt Git

1. Mở file vừa tải về (thường ở thư mục Downloads)
2. Nhấn **"Next"** ở màn hình đầu tiên
3. **Chọn thư mục cài đặt**: Để mặc định `C:\Program Files\Git` → Nhấn **"Next"**
4. **Chọn components**: 
   - Để mặc định (tất cả đã được chọn)
   - Nhấn **"Next"**
5. **Chọn editor**: 
   - Để mặc định "Use Visual Studio Code as Git's default editor" (nếu có VS Code)
   - Hoặc chọn "Use Notepad++" nếu bạn có Notepad++
   - Hoặc để mặc định "Use Notepad"
   - Nhấn **"Next"**
6. **Chọn default branch name**:
   - Để mặc định "Let Git decide" hoặc chọn "main"
   - Nhấn **"Next"**
7. **PATH Environment**:
   - Chọn **"Git from the command line and also from 3rd-party software"** (khuyến nghị)
   - Nhấn **"Next"**
8. **HTTPS transport**:
   - Để mặc định "Use the OpenSSL library"
   - Nhấn **"Next"**
9. **Line ending conversions**:
   - Chọn **"Checkout Windows-style, commit Unix-style line endings"** (mặc định)
   - Nhấn **"Next"**
10. **Terminal emulator**:
    - Chọn **"Use Windows' default console window"** (mặc định)
    - Nhấn **"Next"**
11. **Default behavior of 'git pull'**:
    - Để mặc định
    - Nhấn **"Next"**
12. **Credential helper**:
    - Để mặc định "Git Credential Manager"
    - Nhấn **"Next"**
13. **Extra options**:
    - Để mặc định (không tích gì thêm)
    - Nhấn **"Next"**
14. **Experimental options**:
    - Để mặc định (không tích gì)
    - Nhấn **"Install"**
15. Đợi cài đặt hoàn tất (1-2 phút)
16. Nhấn **"Finish"**

## Bước 3: Khởi động lại Command Prompt

1. **Đóng** Command Prompt hiện tại (nếu đang mở)
2. Mở **Command Prompt mới**:
   - Nhấn phím **Windows**
   - Gõ **"cmd"**
   - Nhấn Enter

## Bước 4: Kiểm tra Git đã cài thành công

1. Trong Command Prompt mới, gõ:
```bash
git --version
```

2. Nhấn Enter
3. Nếu thấy hiển thị số phiên bản (ví dụ: `git version 2.42.0.windows.1`) → ✅ **Thành công!**
4. Nếu vẫn báo lỗi → Xem phần "Xử lý lỗi" bên dưới

## Bước 5: Cấu hình Git (Chỉ cần làm 1 lần)

1. Gõ lệnh sau (thay `Your Name` bằng tên bạn):
```bash
git config --global user.name "Your Name"
```

2. Nhấn Enter

3. Gõ lệnh sau (thay `your.email@example.com` bằng email của bạn):
```bash
git config --global user.email "your.email@example.com"
```

4. Nhấn Enter

**Ví dụ:**
```bash
git config --global user.name "Gia Nhu"
git config --global user.email "gianhu1991@gmail.com"
```

## ✅ Hoàn thành!

Bây giờ bạn có thể quay lại file `HUONG_DAN_CHI_TIET_TUNG_BUOC.md` và tiếp tục từ **Bước 1.4**!

---

## 🆘 Xử lý lỗi

### Lỗi: Vẫn không nhận diện được Git sau khi cài

**Giải pháp:**
1. Khởi động lại máy tính
2. Mở Command Prompt mới
3. Thử lại lệnh `git --version`

### Lỗi: "git: command not found"

**Giải pháp:**
1. Kiểm tra Git đã được cài vào `C:\Program Files\Git` chưa
2. Thêm Git vào PATH thủ công:
   - Nhấn Windows + R
   - Gõ: `sysdm.cpl` → Enter
   - Tab **"Advanced"** → **"Environment Variables"**
   - Trong **"System variables"**, tìm **"Path"** → **"Edit"**
   - Thêm: `C:\Program Files\Git\cmd`
   - Nhấn **"OK"** tất cả
   - Khởi động lại Command Prompt

### Lỗi: Không tải được file Git

**Giải pháp:**
- Thử tải từ mirror: https://github.com/git-for-windows/git/releases
- Tải file `.exe` mới nhất

---

## 📝 Lưu ý

- Sau khi cài Git, **PHẢI** mở Command Prompt mới
- Git chỉ hoạt động trong Command Prompt mới mở
- Nếu vẫn lỗi, khởi động lại máy tính

**Sau khi cài xong Git, quay lại file `HUONG_DAN_CHI_TIET_TUNG_BUOC.md` và tiếp tục!**

