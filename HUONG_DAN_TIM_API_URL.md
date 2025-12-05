# 🔍 Cách tìm URL Server API của bạn

## URL Server API là gì?

**URL Server API** là địa chỉ nơi **backend/API** của bạn đang chạy. Đây là nơi mà:
- App Android sẽ gọi đến để đăng nhập
- Lấy dữ liệu (danh sách bài thi, câu hỏi, v.v.)
- Thực hiện các thao tác (tạo bài thi, nộp bài, v.v.)

---

## 📍 Cách 1: Nếu bạn đã deploy lên Vercel

### Bước 1: Kiểm tra trên Vercel
1. Vào https://vercel.com
2. Đăng nhập vào tài khoản của bạn
3. Tìm project của bạn
4. Xem URL trong phần **Domains** hoặc **Deployments**

### Bước 2: Copy URL
URL thường có dạng:
- `https://thionline.vercel.app`
- `https://thionline-abc123.vercel.app`
- `https://your-custom-domain.com`

**Đây chính là URL bạn cần!**

---

## 📍 Cách 2: Nếu bạn chưa deploy (Cần deploy trước)

### Option A: Deploy lên Vercel (Miễn phí - Khuyến nghị)

#### Bước 1: Cài Vercel CLI
```bash
npm i -g vercel
```

#### Bước 2: Đăng nhập Vercel
```bash
vercel login
```

#### Bước 3: Deploy
```bash
vercel
```

Làm theo hướng dẫn:
- Chọn project name
- Chọn settings (có thể Enter để dùng mặc định)
- Đợi deploy xong

#### Bước 4: Lấy URL
Sau khi deploy xong, Vercel sẽ hiển thị URL, ví dụ:
```
✅ Production: https://thionline.vercel.app
```

**Đây chính là URL bạn cần!**

---

### Option B: Deploy lên server khác

Nếu bạn có server riêng (AWS, DigitalOcean, v.v.):
- URL sẽ là: `https://your-server-ip` hoặc `https://your-domain.com`
- Đảm bảo server đã được cấu hình để chạy Next.js app

---

## 📍 Cách 3: Nếu bạn đang chạy local (Development)

Nếu bạn chỉ muốn test trên máy tính:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

**Lưu ý:** 
- Chỉ dùng được khi test trên emulator Android trên cùng máy
- Không dùng được trên điện thoại thật (trừ khi cùng mạng WiFi và cấu hình phức tạp)

---

## ✅ Sau khi có URL

1. Mở file `.env.local`
2. Thêm dòng:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-url-here
```

**Ví dụ:**
```env
NEXT_PUBLIC_API_BASE_URL=https://thionline.vercel.app
```

**Lưu ý quan trọng:**
- ✅ Phải có `https://` hoặc `http://` ở đầu
- ❌ KHÔNG có dấu `/` ở cuối
- ✅ URL đầy đủ, không thiếu phần nào

---

## 🧪 Kiểm tra URL có đúng không

Sau khi cấu hình, bạn có thể test bằng cách:

1. Mở trình duyệt
2. Truy cập: `https://your-url-here/api/health` (nếu có endpoint này)
3. Hoặc: `https://your-url-here/api/auth/me`
4. Nếu thấy response (có thể là lỗi 401), nghĩa là URL đúng!

---

## ❓ Vẫn không biết URL của mình?

**Hãy trả lời các câu hỏi sau:**

1. **Bạn đã deploy app lên đâu chưa?**
   - ☐ Chưa deploy
   - ☐ Đã deploy lên Vercel
   - ☐ Đã deploy lên server khác
   - ☐ Không biết

2. **Bạn có thể truy cập app qua trình duyệt không?**
   - ☐ Có, URL là: `_________________`
   - ☐ Không

3. **Bạn có tài khoản Vercel không?**
   - ☐ Có
   - ☐ Không

**Sau khi trả lời, tôi sẽ hướng dẫn cụ thể hơn!**

