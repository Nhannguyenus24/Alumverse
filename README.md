# Hướng dẫn cài đặt và chạy dự án

## Yêu cầu cài đặt sẵn (Prerequisites)
Trước khi chạy dự án, hãy đảm bảo máy tính của bạn đã cài đặt các phần mềm sau:
- **Node.js** (Khuyến nghị bản LTS mới nhất)
- **Java 17** (Dùng để chạy Backend)
- **Docker & Docker Compose** (Dùng để chạy Database, Nginx, Prometheus)

---

## Các bước khởi chạy dự án

### Bước 1: Thiết lập các biến môi trường và cấu hình
Bạn cần thiết lập các key và thông tin cấu hình cho cả Frontend và Backend.

**Frontend:**
1. Di chuyển vào thư mục `frontend/`.
2. Tạo file `.env` (nếu chưa có) dựa trên nội dung có sẵn và điền đầy đủ các key cấu hình:
   - `VITE_API_BASE_URL`
   - `VITE_WS_CHAT_URL`
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_RECAPTCHA_SITE_KEY`
   - v.v.

**Backend:**
1. Di chuyển vào thư mục `backend/src/main/resources/`.
2. Mở file `application.properties` (hoặc tạo file `.env` trong thư mục `backend/`).
3. Đảm bảo cấu hình đúng các key quan trọng như:
   - Thông tin kết nối DB (`spring.r2dbc.*`, `spring.flyway.*`)
   - `jwt.secret`
   - `google.oauth.client-id`
   - `gemini.api.key`
   - Cấu hình gửi mail (`spring.mail.*`)

---

### Bước 2: Khởi động các dịch vụ hạ tầng (Database, Nginx, Prometheus)
Mở terminal tại **thư mục gốc** của dự án và chạy lệnh Docker Compose để khởi động các container ngầm:

```bash
docker compose up -d
```
*Lệnh này sẽ start Nginx, Database (PostgreSQL) và Prometheus.*

---

### Bước 3: Khởi chạy Frontend
Mở một cửa sổ terminal mới, di chuyển vào thư mục `frontend` và chạy:

```bash
cd frontend
npm i --legacy-peer-deps
npm run dev
```

---

### Bước 4: Khởi chạy Backend (Spring Boot)
Mở một cửa sổ terminal khác, di chuyển vào thư mục `backend` và chạy lệnh tương ứng với hệ điều hành của bạn:

**Trên Windows:**
```bash
cd backend
.\mvnw.cmd spring-boot:run
```

**Trên Linux / macOS:**
```bash
cd backend
./mvnw spring-boot:run
```
