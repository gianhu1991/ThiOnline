# Quick Start - Tạo Android App

## Bước nhanh (5 phút)

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình API URL
Tạo file `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com
```

### 3. Build và khởi tạo Android project
```bash
# Build static
npm run build:static

# Thêm Android platform
npm run cap:add:android

# Sync code
npm run cap:sync
```

### 4. Mở Android Studio
```bash
npm run cap:open:android
```

### 5. Build và chạy
- Trong Android Studio, click nút **Run** (▶️)
- Chọn thiết bị hoặc emulator
- Đợi app build và chạy

## Lưu ý quan trọng

⚠️ **API routes cần được deploy riêng trên server**

Vì Next.js app có API routes, bạn cần:
1. Deploy API lên server (Vercel, AWS, etc.)
2. Cấu hình `NEXT_PUBLIC_API_BASE_URL` trỏ đến server đó
3. Cấu hình CORS trên server để cho phép mobile app gọi API

## Xem hướng dẫn chi tiết

Xem file `ANDROID_SETUP.md` để biết thêm chi tiết về:
- Cấu hình nâng cao
- Build APK để phân phối
- Xử lý lỗi
- Troubleshooting

