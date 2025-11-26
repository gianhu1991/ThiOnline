# Hệ thống Thi Trắc Nghiệm Online

Phần mềm thi trắc nghiệm trực tuyến với đầy đủ tính năng quản lý ngân hàng câu hỏi, tạo bài thi và làm bài thi.

## Tính năng

### 1. Quản lý Ngân hàng Câu hỏi
- Import câu hỏi từ file Excel (.xlsx, .xls) hoặc PDF (.pdf)
- Xem danh sách tất cả câu hỏi
- Xóa câu hỏi
- Hỗ trợ câu hỏi chọn 1 đáp án hoặc nhiều đáp án

### 2. Tạo Bài Thi
- Chọn số lượng câu hỏi trong bài thi
- Thiết lập thời gian làm bài (phút)
- Thiết lập thời gian mở/đóng bài thi
- Tùy chọn trộn câu hỏi (mỗi lần làm bài có thứ tự khác nhau)
- Tùy chọn trộn đáp án (mỗi lần làm bài có thứ tự đáp án khác nhau)
- Thiết lập số lần làm bài tối đa

### 3. Làm Bài Thi
- Hiển thị đồng hồ đếm ngược thời gian
- Tự động nộp bài khi hết thời gian
- Giao diện thân thiện, dễ sử dụng
- Hỗ trợ câu hỏi chọn 1 hoặc nhiều đáp án

### 4. Xem Kết Quả
- Hiển thị điểm số và số câu đúng/sai
- Xem lịch sử làm bài của tất cả thí sinh
- Thống kê thời gian làm bài

## Công nghệ sử dụng

- **Next.js 14** - Framework React với App Router
- **TypeScript** - Type safety
- **Prisma** - ORM cho database
- **PostgreSQL** - Database (hỗ trợ deploy lên web)
- **Tailwind CSS** - Styling
- **React Hook Form** - Form handling
- **xlsx** - Xử lý file Excel
- **pdf-parse** - Xử lý file PDF

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Thiết lập database

**Cho development (SQLite):**
```bash
# Tạo file .env với:
# DATABASE_URL="file:./dev.db"
# Sau đó đổi provider trong schema.prisma thành "sqlite"
npx prisma db push
```

**Cho production (PostgreSQL):**
```bash
# Tạo file .env với connection string PostgreSQL:
# DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
npx prisma db push
npx prisma generate
```

Xem file `DEPLOY.md` để biết cách deploy lên web (Vercel, Railway, VPS).

### 3. Chạy ứng dụng

```bash
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000)

## Hướng dẫn sử dụng

### Import câu hỏi từ Excel

Format file Excel cần có các cột:
- **Câu hỏi** (hoặc Question, Cau hoi): Nội dung câu hỏi
- **Đáp án 1, Đáp án 2, ...**: Các đáp án (tối đa 10 đáp án)
- **Đáp án đúng** (hoặc Correct Answer, Dap an dung): Đáp án đúng, ví dụ "A" hoặc "A,B" (nếu nhiều đáp án)
- **Loại** (hoặc Type, Loai): "single" hoặc "multiple"

Ví dụ:
| Câu hỏi | Đáp án 1 | Đáp án 2 | Đáp án 3 | Đáp án 4 | Đáp án đúng | Loại |
|---------|----------|----------|----------|----------|-------------|------|
| 2+2 bằng bao nhiêu? | 3 | 4 | 5 | 6 | B | single |
| Các số chẵn là? | 2 | 3 | 4 | 5 | A,C | multiple |

### Import câu hỏi từ PDF

Format file PDF:
```
Câu hỏi 1: 2+2 bằng bao nhiêu?
A. 3
B. 4
C. 5
D. 6
Đáp án: B

Câu hỏi 2: Các số chẵn là?
A. 2
B. 3
C. 4
D. 5
Đáp án: A,C
```

### Tạo bài thi

1. Vào trang "Tạo bài thi"
2. Điền thông tin:
   - Tiêu đề bài thi
   - Mô tả (tùy chọn)
   - Số lượng câu hỏi (sẽ lấy ngẫu nhiên từ ngân hàng)
   - Thời gian làm bài (phút)
   - Thời gian mở/đóng bài thi
   - Số lần làm bài tối đa
   - Tùy chọn trộn câu hỏi/đáp án
3. Nhấn "Tạo bài thi"

### Làm bài thi

1. Vào trang "Quản lý bài thi"
2. Chọn bài thi và nhấn "Làm bài"
3. Nhập họ tên (bắt buộc) và mã số sinh viên (tùy chọn)
4. Làm bài và nhấn "Nộp bài" khi hoàn thành
5. Xem kết quả ngay sau khi nộp bài

## Cấu trúc dự án

```
├── app/
│   ├── api/              # API routes
│   │   ├── questions/    # API quản lý câu hỏi
│   │   └── exams/        # API quản lý bài thi
│   ├── exams/            # Trang quản lý và làm bài thi
│   ├── questions/         # Trang quản lý ngân hàng câu hỏi
│   ├── layout.tsx        # Layout chính
│   └── page.tsx          # Trang chủ
├── lib/
│   └── prisma.ts         # Prisma client
├── prisma/
│   └── schema.prisma     # Database schema
└── package.json
```

## Lưu ý

- File Excel/PDF cần đúng format để import thành công
- Mỗi lần làm bài, hệ thống sẽ lấy ngẫu nhiên câu hỏi từ ngân hàng (nếu bật trộn câu hỏi)
- Bài thi sẽ tự động đóng khi hết thời gian
- Thí sinh chỉ có thể làm bài trong thời gian mở bài thi và không vượt quá số lần làm bài tối đa

## 🚀 Deploy lên Web

**👉 Xem file [HUONG_DAN_CHI_TIET_TUNG_BUOC.md](./HUONG_DAN_CHI_TIET_TUNG_BUOC.md) để có hướng dẫn CHI TIẾT TỪNG BƯỚC!**

Hướng dẫn đơn giản nhất: **Vercel + Supabase** (hoàn toàn miễn phí)

**File hướng dẫn chi tiết bao gồm:**
- ✅ Hướng dẫn từng bước, không bỏ sót gì
- ✅ Copy-paste lệnh cụ thể
- ✅ Giải thích từng thao tác
- ✅ Xử lý lỗi thường gặp

**Các bước chính:**
1. Đẩy code lên GitHub (15 phút)
2. Tạo database trên Supabase (10 phút)
3. Import project vào Vercel (10 phút)
4. Chạy migration database (5 phút)
5. Kiểm tra website (2 phút)

👉 **Mở file `HUONG_DAN_CHI_TIET_TUNG_BUOC.md` và làm theo từng bước!**

## Phát triển thêm

Có thể mở rộng thêm các tính năng:
- Đăng nhập/đăng ký
- Phân quyền (admin, giáo viên, học sinh)
- Xuất kết quả ra Excel/PDF
- Thống kê chi tiết
- Gửi email thông báo kết quả


