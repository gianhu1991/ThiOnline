# 📱 Hướng dẫn tạo Android App - Đơn giản nhất

## ⚠️ QUAN TRỌNG: Đọc kỹ trước khi bắt đầu

Vì ứng dụng của bạn có **API routes** (backend), nên có **2 cách** để tạo Android app:

### Cách 1: Deploy API riêng (Khuyến nghị - Đơn giản hơn)
- Deploy API lên Vercel/server
- Build frontend static
- App Android gọi API qua internet

### Cách 2: Chạy server trong app (Phức tạp hơn)
- Cần build Next.js standalone
- App sẽ lớn hơn (~100MB+)
- Phức tạp hơn trong setup

**Tôi khuyến nghị Cách 1** vì đơn giản và dễ maintain hơn.

---

## 🚀 BƯỚC 1: Chạy script setup tự động

Mở terminal/PowerShell trong thư mục project và chạy:

```bash
npm run setup:android
```

Script này sẽ:
- ✅ Kiểm tra môi trường
- ✅ Cài đặt dependencies cần thiết
- ✅ Tạo file cấu hình

---

## 🌐 BƯỚC 2: Deploy API lên server

### Nếu bạn đã deploy API trên Vercel/server:
- Ghi lại URL của API (ví dụ: `https://thionline.vercel.app`)
- Bỏ qua bước này

### Nếu chưa deploy:
1. **Deploy lên Vercel** (miễn phí):
   ```bash
   # Cài Vercel CLI (nếu chưa có)
   npm i -g vercel
   
   # Deploy
   vercel
   ```
   
2. Hoặc deploy lên server khác (AWS, DigitalOcean, etc.)

3. **Ghi lại URL API** của bạn

---

## ⚙️ BƯỚC 3: Cấu hình API URL

Mở file `.env.local` và thêm:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-url.com
```

**Ví dụ:**
```env
NEXT_PUBLIC_API_BASE_URL=https://thionline.vercel.app
```

**Lưu ý:** 
- Không có dấu `/` ở cuối
- Phải là URL đầy đủ với `https://` hoặc `http://`

---

## 🔨 BƯỚC 4: Build frontend

Chạy lệnh:

```bash
npm run build:static
```

**Lưu ý:** Lệnh này có thể mất 2-5 phút.

Nếu gặp lỗi về API routes, đây là bình thường. API routes sẽ không được export, nhưng không sao vì chúng ta đã deploy API riêng rồi.

---

## 📱 BƯỚC 5: Tạo Android project

Chạy các lệnh sau (từng lệnh một):

```bash
# Thêm Android platform
npm run cap:add:android
```

Đợi lệnh chạy xong (có thể mất 1-2 phút).

```bash
# Sync code vào Android project
npm run cap:sync
```

---

## 🎨 BƯỚC 6: Mở Android Studio

```bash
npm run cap:open:android
```

Lệnh này sẽ mở Android Studio.

**Lần đầu mở có thể mất 5-10 phút** để:
- Download Gradle
- Sync project
- Index files

**Hãy kiên nhẫn đợi!**

---

## ▶️ BƯỚC 7: Build và chạy app

Trong Android Studio:

1. **Đợi Gradle sync hoàn tất** (xem thanh progress bar ở dưới)

2. **Kết nối thiết bị Android:**
   - Bật USB Debugging trên điện thoại
   - Kết nối qua USB
   - Hoặc khởi động Android Emulator

3. **Click nút Run (▶️)** hoặc nhấn `Shift + F10`

4. **Đợi app build và cài đặt** (có thể mất 2-5 phút lần đầu)

5. **App sẽ tự động mở trên thiết bị!** 🎉

---

## 🐛 Xử lý lỗi thường gặp

### Lỗi: "Gradle sync failed"
- Đợi thêm vài phút
- Thử File → Invalidate Caches → Restart
- Kiểm tra kết nối internet (cần download dependencies)

### Lỗi: "SDK not found"
- Mở Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK
- Cài đặt Android SDK Platform 33 hoặc mới hơn

### Lỗi: "API calls fail"
- Kiểm tra `NEXT_PUBLIC_API_BASE_URL` trong `.env.local`
- Kiểm tra API đã được deploy và hoạt động chưa
- Kiểm tra CORS trên server (xem phần dưới)

### App không kết nối được API
- Kiểm tra internet trên điện thoại
- Kiểm tra URL API đúng chưa
- Kiểm tra CORS settings trên server

---

## 🔒 Cấu hình CORS cho API

Nếu API của bạn chưa cho phép mobile app gọi, cần thêm CORS headers.

Tạo file `middleware-cors.ts` trong thư mục `app/api/` hoặc cập nhật các API routes:

```typescript
// Thêm vào đầu mỗi API route
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

---

## 📦 Build APK để phân phối

Sau khi app chạy được, bạn có thể build APK:

### Build Debug APK (để test):
```bash
cd android
./gradlew assembleDebug
```

APK nằm tại: `android/app/build/outputs/apk/debug/app-debug.apk`

### Build Release APK (để publish):
1. Tạo keystore (chỉ làm 1 lần):
```bash
keytool -genkey -v -keystore thionline-release.keystore -alias thionline -keyalg RSA -keysize 2048 -validity 10000
```

2. Tạo file `android/key.properties`:
```properties
storePassword=your-password
keyPassword=your-password
keyAlias=thionline
storeFile=../thionline-release.keystore
```

3. Build:
```bash
cd android
./gradlew assembleRelease
```

APK nằm tại: `android/app/build/outputs/apk/release/app-release.apk`

---

## ✅ Checklist hoàn thành

- [ ] Đã chạy `npm run setup:android`
- [ ] Đã deploy API lên server
- [ ] Đã cấu hình `NEXT_PUBLIC_API_BASE_URL` trong `.env.local`
- [ ] Đã build static: `npm run build:static`
- [ ] Đã tạo Android project: `npm run cap:add:android`
- [ ] Đã sync: `npm run cap:sync`
- [ ] Đã mở Android Studio: `npm run cap:open:android`
- [ ] Đã build và chạy app thành công

---

## 🆘 Cần giúp đỡ?

Nếu gặp vấn đề:
1. Xem lại các bước trên
2. Kiểm tra logs trong Android Studio
3. Xem file `ANDROID_SETUP.md` để biết chi tiết kỹ thuật

---

**Chúc bạn thành công! 🎉**

