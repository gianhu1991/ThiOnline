# 🌐 Hướng dẫn Cấu hình Domain trên Vercel

## ⚠️ Vấn đề: "Invalid Configuration"

Khi domain hiển thị **"Invalid Configuration"**, nghĩa là DNS records chưa được cấu hình đúng hoặc chưa được verify.

---

## 📋 Bước 1: Xem DNS Records cần cấu hình

1. Vào **Vercel Dashboard** → **Project** của bạn
2. Click tab **"Settings"** → **"Domains"**
3. Click vào domain `ttvtnhoquantest.app`
4. Xem tab **"DNS Records"** - Vercel sẽ hiển thị các DNS records cần thêm

**Ví dụ DNS records cần thêm:**
- **Type:** `A`
- **Name:** `@` (hoặc để trống)
- **Value:** `216.198.79.1` (hoặc IP khác mà Vercel cung cấp)

---

## 🔧 Bước 2: Cấu hình DNS ở nhà cung cấp Domain

### 2.1. Xác định nhà cung cấp Domain

**⚠️ QUAN TRỌNG:** Nếu domain của bạn được mua từ Google Domains:
- Google Domains đã được **Squarespace mua lại** (từ 7/9/2023)
- Tất cả domain từ Google Domains đã được **chuyển sang Squarespace**
- Bạn cần đăng nhập vào **Squarespace** để quản lý DNS

Domain `.app` thường được mua từ:
- **Squarespace** (từ Google Domains chuyển sang) ⭐ **Nếu bạn thấy thông báo về Squarespace, dùng cách này**
- **Namecheap**
- **GoDaddy**
- **Cloudflare**
- Hoặc nhà cung cấp khác

### 2.2. Đăng nhập vào quản lý Domain

#### Nếu domain từ Google Domains (đã chuyển sang Squarespace):

1. **Truy cập Squarespace:**
   - Vào: **https://www.squarespace.com**
   - Hoặc: **https://domains.squarespace.com**

2. **Đăng nhập:**
   - Sử dụng **email và mật khẩu** mà bạn đã dùng cho Google Domains
   - Hoặc click **"Sign in with Google"** nếu bạn đã liên kết tài khoản

3. **Tìm domain của bạn:**
   - Sau khi đăng nhập, vào **"Domains"** hoặc **"My Domains"**
   - Tìm domain `ttvtnhoquantest.app`

4. **Vào DNS Settings:**
   - Click vào domain
   - Tìm tab **"DNS Settings"** hoặc **"DNS Records"**
   - Hoặc click **"Manage DNS"**

#### Nếu domain từ nhà cung cấp khác:

1. Truy cập website của nhà cung cấp domain
2. Đăng nhập vào tài khoản
3. Tìm phần **"DNS Management"** hoặc **"DNS Settings"** hoặc **"Manage DNS"**

### 2.3. Thêm DNS Record

#### Trên Squarespace:

1. **Vào DNS Settings:**
   - Click vào domain `ttvtnhoquantest.app`
   - Scroll xuống tìm phần **"DNS Records"** hoặc **"Custom Records"**

2. **Thêm A Record:**
   - Click **"Add Record"** hoặc **"Add"**
   - Chọn **"A Record"** từ dropdown
   - Điền thông tin:
     - **Host:** `@` hoặc để trống (đại diện cho domain chính)
     - **Points to:** `216.198.79.1` (hoặc IP mà Vercel cung cấp)
     - **TTL:** `3600` hoặc để mặc định
   - Click **"Save"** hoặc **"Add Record"**

3. **Xóa records cũ (nếu có):**
   - Nếu có A records cũ trỏ đến IP khác, xóa chúng đi
   - Chỉ giữ lại A record mới trỏ đến IP của Vercel

#### Trên các nhà cung cấp khác:

**Cách 1: Thêm A Record (Khuyến nghị)**

1. Tìm phần **"A Records"** hoặc **"DNS Records"**
2. Click **"Add Record"** hoặc **"Thêm bản ghi"**
3. Điền thông tin:
   - **Type:** `A` (hoặc `A Record`)
   - **Name/Host:** `@` hoặc để trống (đại diện cho domain chính)
   - **Value/IP Address:** `216.198.79.1` (hoặc IP mà Vercel cung cấp)
   - **TTL:** `3600` hoặc để mặc định
4. Click **"Save"** hoặc **"Lưu"**

**Cách 2: Sử dụng CNAME (Nếu A Record không hoạt động)**

1. Thêm CNAME record:
   - **Type:** `CNAME`
   - **Name:** `@` hoặc để trống
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** `3600`
2. Click **"Save"**

---

## ⏳ Bước 3: Đợi DNS Propagate

Sau khi thêm DNS records:

1. **Đợi 5-30 phút** để DNS propagate (lan truyền)
2. Có thể mất **tối đa 48 giờ** (nhưng thường chỉ cần vài phút đến vài giờ)

**Kiểm tra DNS đã propagate chưa:**

Sử dụng công cụ online:
- https://dnschecker.org
- https://www.whatsmydns.net

Nhập domain `ttvtnhoquantest.app` và kiểm tra xem IP có trùng với IP của Vercel không.

---

## ✅ Bước 4: Verify Domain trên Vercel

1. Quay lại **Vercel Dashboard** → **Settings** → **Domains**
2. Click vào domain `ttvtnhoquantest.app`
3. Click nút **"Refresh"** hoặc **"Verify"**
4. Nếu DNS đã đúng, trạng thái sẽ chuyển từ **"Invalid Configuration"** → **"Valid Configuration"**

---

## 🔍 Bước 5: Xử lý các lỗi thường gặp

### Lỗi 1: DNS chưa propagate

**Triệu chứng:** Domain vẫn hiển thị "Invalid Configuration" sau khi thêm DNS

**Giải pháp:**
- Đợi thêm 10-30 phút
- Kiểm tra lại DNS records đã đúng chưa
- Thử refresh lại trên Vercel

### Lỗi 2: DNS records không đúng

**Triệu chứng:** IP address không khớp

**Giải pháp:**
- Kiểm tra lại IP address trong Vercel
- Đảm bảo đã thêm đúng Type (A hoặc CNAME)
- Xóa record cũ và thêm lại

### Lỗi 3: Domain đang được sử dụng ở nơi khác

**Triệu chứng:** Domain không thể verify

**Giải pháp:**
- Kiểm tra domain có đang trỏ đến hosting khác không
- Xóa tất cả DNS records cũ
- Chỉ giữ lại records mà Vercel yêu cầu

---

## 📝 Lưu ý quan trọng

1. **DNS Records mới:**
   - Vercel khuyến nghị dùng IP mới: `216.198.79.1`
   - Records cũ (`cname.vercel-dns.com` và `76.76.21.21`) vẫn hoạt động nhưng nên dùng records mới

2. **Multiple Records:**
   - Có thể cần thêm nhiều A records nếu Vercel yêu cầu
   - Mỗi record có IP khác nhau

3. **Subdomain:**
   - Nếu muốn dùng subdomain (ví dụ: `www.ttvtnhoquantest.app`), cần thêm CNAME record:
     - **Name:** `www`
     - **Value:** `cname.vercel-dns.com`

---

## 🆘 Cần hỗ trợ thêm?

Nếu vẫn gặp vấn đề:

1. **Kiểm tra lại DNS records:**
   - Đảm bảo đã thêm đúng Type, Name, và Value
   - Đợi đủ thời gian để DNS propagate

2. **Liên hệ Vercel Support:**
   - Vào https://vercel.com/support
   - Mô tả vấn đề và cung cấp domain name

3. **Kiểm tra nhà cung cấp Domain:**
   - Đảm bảo domain đã được kích hoạt
   - Kiểm tra domain có bị khóa không

---

## ✅ Checklist

- [ ] Đã xem DNS records cần thêm trong Vercel
- [ ] Đã đăng nhập vào nhà cung cấp domain
- [ ] Đã thêm A record hoặc CNAME record
- [ ] Đã đợi ít nhất 10-30 phút
- [ ] Đã refresh/verify lại trên Vercel
- [ ] Domain đã chuyển sang "Valid Configuration"

