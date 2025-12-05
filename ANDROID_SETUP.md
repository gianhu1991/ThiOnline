# Hướng dẫn tạo Android App từ Next.js Web App

## Tổng quan

Ứng dụng web Next.js của bạn sẽ được chuyển đổi thành Android app sử dụng **Capacitor**. Capacitor sẽ wrap web app thành native Android app.

## ⚠️ Lưu ý quan trọng

Vì ứng dụng của bạn có **API routes** (Next.js API), nên:

1. **API routes cần được deploy riêng** trên server (Vercel, AWS, etc.)
2. **Frontend sẽ gọi API qua URL** thay vì relative path
3. Cần cấu hình `NEXT_PUBLIC_API_BASE_URL` trong file `.env.local`

## Yêu cầu hệ thống

- Node.js 18+ đã cài đặt
- Android Studio đã cài đặt
- Java JDK 11+ đã cài đặt
- Git đã cài đặt

## Bước 1: Cài đặt dependencies

```bash
npm install
```

## Bước 2: Cấu hình API Base URL

Tạo file `.env.local` (nếu chưa có) và thêm:

```env
# API Base URL cho mobile app
# Thay bằng URL server thực tế của bạn
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com
```

**Lưu ý**: 
- Trong development, có thể dùng `http://localhost:3000` (nhưng cần cấu hình CORS)
- Trong production, dùng URL server thực tế (ví dụ: `https://thionline.vercel.app`)

## Bước 3: Build static frontend

```bash
npm run build:static
```

Lệnh này sẽ:
- Generate Prisma client
- Build Next.js app với static export
- Output sẽ nằm trong thư mục `out/`

## Bước 4: Khởi tạo Android project

```bash
# Thêm Android platform
npm run cap:add:android

# Sync code vào Android project
npm run cap:sync
```

## Bước 5: Mở Android Studio và build

```bash
# Mở Android Studio
npm run cap:open:android
```

Trong Android Studio:
1. Đợi Gradle sync hoàn tất
2. Kết nối thiết bị Android hoặc khởi động emulator
3. Click nút **Run** (▶️) để build và chạy app

## Bước 6: Cấu hình app (tùy chọn)

### Thay đổi App ID và tên app

Sửa file `capacitor.config.ts`:

```typescript
appId: 'com.yourcompany.thionline', // Thay đổi ID
appName: 'TTVT Nho Quan', // Thay đổi tên
```

### Thay đổi icon và splash screen

1. Thay icon: `android/app/src/main/res/mipmap-*/ic_launcher.png`
2. Thay splash: `android/app/src/main/res/drawable/splash.png`

## Bước 7: Build APK để phân phối

### Build Debug APK (để test)

```bash
cd android
./gradlew assembleDebug
```

APK sẽ nằm tại: `android/app/build/outputs/apk/debug/app-debug.apk`

### Build Release APK (để publish)

1. Tạo keystore (nếu chưa có):
```bash
keytool -genkey -v -keystore thionline-release.keystore -alias thionline -keyalg RSA -keysize 2048 -validity 10000
```

2. Tạo file `android/key.properties`:
```properties
storePassword=your-store-password
keyPassword=your-key-password
keyAlias=thionline
storeFile=../thionline-release.keystore
```

3. Cập nhật `android/app/build.gradle` để sử dụng keystore (xem hướng dẫn chi tiết trong file)

4. Build release:
```bash
cd android
./gradlew assembleRelease
```

APK sẽ nằm tại: `android/app/build/outputs/apk/release/app-release.apk`

## Cấu hình CORS cho API

Nếu API của bạn chạy trên server riêng, cần cấu hình CORS để cho phép mobile app gọi API.

Thêm vào API routes (ví dụ: `app/api/auth/login/route.ts`):

```typescript
export async function POST(request: NextRequest) {
  // ... existing code ...
  
  const response = NextResponse.json({ ... });
  
  // Thêm CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}
```

Hoặc tạo middleware CORS riêng.

## Xử lý Authentication

App đã được cấu hình để:
- **Web**: Sử dụng cookies để lưu JWT token
- **Mobile**: Sử dụng Capacitor Preferences để lưu JWT token

Code đã tự động phát hiện môi trường và sử dụng phương thức phù hợp.

## Cập nhật app sau khi thay đổi code

Sau khi thay đổi code frontend:

```bash
# 1. Build lại
npm run build:static

# 2. Sync vào Android project
npm run cap:sync

# 3. Mở Android Studio và build lại
npm run cap:open:android
```

## Troubleshooting

### Lỗi: "Cannot find module '@capacitor/core'"
```bash
npm install
```

### Lỗi: "API calls fail in mobile app"
- Kiểm tra `NEXT_PUBLIC_API_BASE_URL` đã được cấu hình đúng chưa
- Kiểm tra CORS đã được cấu hình trên server chưa
- Kiểm tra network permissions trong `AndroidManifest.xml`

### Lỗi: "Build failed"
- Đảm bảo Android Studio và Gradle đã được cài đặt đúng
- Thử clean build: `cd android && ./gradlew clean`

## Tài liệu tham khảo

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)

## Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Logs trong Android Studio
2. Network requests trong Chrome DevTools (kết nối qua USB debugging)
3. Capacitor logs: `npx cap doctor`

