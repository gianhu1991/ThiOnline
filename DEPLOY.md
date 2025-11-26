# Hướng dẫn Deploy lên Web

## Phương pháp 1: Deploy lên Vercel (Khuyến nghị - Miễn phí)

Vercel là nền tảng tốt nhất để deploy Next.js, hỗ trợ miễn phí và dễ sử dụng.

### Bước 1: Chuẩn bị Database

Vercel không hỗ trợ SQLite, bạn cần dùng PostgreSQL. Có 2 lựa chọn:

#### Option A: Vercel Postgres (Khuyến nghị)
1. Tạo tài khoản tại [vercel.com](https://vercel.com)
2. Tạo project mới
3. Vào tab **Storage** → **Create Database** → Chọn **Postgres**
4. Copy connection string

#### Option B: Supabase (Miễn phí)
1. Tạo tài khoản tại [supabase.com](https://supabase.com)
2. Tạo project mới
3. Vào **Settings** → **Database** → Copy connection string

### Bước 2: Cập nhật Database Schema

1. Cập nhật file `.env` với connection string PostgreSQL:
```bash
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

2. Chạy migration:
```bash
npx prisma db push
npx prisma generate
```

### Bước 3: Deploy lên Vercel

#### Cách 1: Deploy qua GitHub (Khuyến nghị)

1. **Đẩy code lên GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/thionline.git
git push -u origin main
```

2. **Deploy trên Vercel:**
   - Vào [vercel.com](https://vercel.com)
   - Nhấn **Add New Project**
   - Import repository từ GitHub
   - Thêm biến môi trường `DATABASE_URL` (từ Vercel Postgres hoặc Supabase)
   - Nhấn **Deploy**

#### Cách 2: Deploy bằng Vercel CLI

1. **Cài đặt Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login và deploy:**
```bash
vercel login
vercel
```

3. **Thêm biến môi trường:**
```bash
vercel env add DATABASE_URL
# Paste connection string khi được hỏi
```

4. **Deploy production:**
```bash
vercel --prod
```

### Bước 4: Chạy Migration trên Production

Sau khi deploy, bạn cần chạy migration:

```bash
vercel env pull .env.production
npx prisma db push
```

Hoặc thêm script vào `package.json`:
```json
"postinstall": "prisma generate && prisma db push"
```

## Phương pháp 2: Deploy lên VPS/Server riêng

### Yêu cầu:
- Node.js 18+
- PostgreSQL hoặc MySQL
- PM2 (để chạy ứng dụng)

### Các bước:

1. **Clone code lên server:**
```bash
git clone https://github.com/username/thionline.git
cd thionline
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Cấu hình database:**
```bash
# Tạo file .env
nano .env
# Thêm DATABASE_URL
```

4. **Chạy migration:**
```bash
npx prisma db push
npx prisma generate
```

5. **Build ứng dụng:**
```bash
npm run build
```

6. **Chạy với PM2:**
```bash
npm install -g pm2
pm2 start npm --name "thionline" -- start
pm2 save
pm2 startup
```

7. **Cấu hình Nginx (tùy chọn):**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Phương pháp 3: Deploy lên Railway (Miễn phí)

1. Tạo tài khoản tại [railway.app](https://railway.app)
2. Tạo project mới → **Deploy from GitHub repo**
3. Thêm PostgreSQL database
4. Thêm biến môi trường `DATABASE_URL`
5. Railway sẽ tự động deploy

## Lưu ý quan trọng

1. **Database Migration:** Luôn chạy `prisma db push` sau khi deploy
2. **Environment Variables:** Đảm bảo `DATABASE_URL` được cấu hình đúng
3. **File Upload:** Vercel có giới hạn 4.5MB cho file upload, cần xử lý file lớn
4. **Build Time:** Thêm script `postinstall` để tự động generate Prisma client

## Troubleshooting

### Lỗi: "Prisma Client has not been generated"
```bash
npx prisma generate
```

### Lỗi: "Database connection failed"
- Kiểm tra `DATABASE_URL` trong environment variables
- Đảm bảo database đã được tạo và accessible

### Lỗi: "Module not found"
```bash
npm install
npm run build
```

## Cập nhật ứng dụng

Sau khi thay đổi code:
```bash
git add .
git commit -m "Update"
git push
# Vercel sẽ tự động deploy
```

