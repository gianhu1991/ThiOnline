# Hướng dẫn lấy BLOB_READ_WRITE_TOKEN cho Vercel Blob Storage

## Bước 1: Tạo Blob Store (nếu chưa có)

1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project của bạn
3. Vào tab **Storage**
4. Click **Create Database** → Chọn **Blob**
5. Đặt tên (ví dụ: "Luutru") và click **Create**

## Bước 2: Lấy Token

### Cách 1: Từ Blob Store Settings (Khuyến nghị)

1. Vào **Storage** → Chọn Blob Store của bạn (ví dụ: "Luutru")
2. Click vào tab **Settings** (trong sidebar bên trái)
3. Tìm phần **Environment Variables** hoặc **Tokens**
4. Copy giá trị của `BLOB_READ_WRITE_TOKEN`

### Cách 2: Connect Blob Store với Project

1. Trong trang Blob Store, click nút **"Connect Project"** (góc trên bên phải)
2. Chọn project của bạn
3. Token sẽ **tự động** được thêm vào Environment Variables của project

### Cách 3: Từ Project Environment Variables

1. Vào **Project** → **Settings** → **Environment Variables**
2. Tìm biến `BLOB_READ_WRITE_TOKEN`
3. Nếu có, copy giá trị
4. Nếu không có, quay lại Bước 2 - Cách 2 để connect Blob Store

## Bước 3: Thêm Token vào Environment Variables

1. Vào **Project** → **Settings** → **Environment Variables**
2. Click **Add New**
3. Điền:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: (paste token vừa copy)
   - **Environment**: Chọn tất cả (Production, Preview, Development)
4. Click **Save**

## Bước 4: Redeploy Project

Sau khi thêm token, bạn cần redeploy project:

1. Vào **Deployments**
2. Click **...** (3 chấm) trên deployment mới nhất
3. Chọn **Redeploy**

Hoặc push code mới lên GitHub để tự động deploy.

## Kiểm tra Token

Sau khi deploy, thử upload video từ PC:
- Nếu thành công → Token đã hoạt động ✅
- Nếu lỗi "BLOB_READ_WRITE_TOKEN" → Kiểm tra lại token và redeploy

## Lưu ý

- Token được tạo tự động khi tạo Blob Store
- Nếu connect Blob Store với project, token sẽ tự động được thêm vào Environment Variables
- Token có dạng: `vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Không chia sẻ token này với người khác!

