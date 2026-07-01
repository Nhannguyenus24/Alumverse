# Plan: Thêm `createdAt` / `updatedAt` cho bảng Quỹ (funds)

> Ngày tạo: 2026-06-27
> Mục tiêu: Bổ sung 2 cột thời gian `created_at` và `updated_at` cho bảng `funds`, cho phép theo dõi thời điểm tạo và cập nhật quỹ.

## 1. Bối cảnh hiện tại

- **ORM**: Spring Data **R2DBC** (reactive, WebFlux) — không phải JPA.
- **Entity**: `backend/src/main/java/com/service/backend/shared/entity/Funds.java` — hiện **chưa có** `createdAt` / `updatedAt`.
- **Bảng SQL**: `funds` (định nghĩa trong `docs/postgre.sql`, dòng ~349-367) — chưa có cột `created_at` / `updated_at`.
- **Auditing đã sẵn sàng**: `@EnableR2dbcAuditing` đã được bật trong `BackendApplication.java`. Vì vậy chỉ cần thêm annotation `@CreatedDate` / `@LastModifiedDate` là Spring tự động gán giá trị khi `save()` — **không cần sửa config**.
- **Pattern mẫu đã có**: Entity `ForumTopic.java` đã triển khai đúng pattern này → áp dụng y hệt cho `Funds`.
- **Khởi tạo DB**: Schema được nạp từ `docs/postgre.sql` khi `docker compose` dựng lại container DB. Ngoài ra **vẫn tạo migration file** trong `docs/migrations/` cho thay đổi này (đã gộp chung với `manager_email` thành 1 file — xem 2.1).

## 2. Các thay đổi cần làm

### 2.1. Cập nhật schema gốc — `docs/postgre.sql` (BẮT BUỘC)

Thêm 2 dòng vào định nghĩa `CREATE TABLE "funds"`:

```sql
  "topic" text,
  "time_ended" timestamp,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,   -- thêm
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP    -- thêm
```

> Sau khi sửa schema gốc, dựng lại DB bằng `docker compose` (dev), hoặc chạy migration trên DB đang có dữ liệu.
>
> **Migration file (BẮT BUỘC)**: `docs/migrations/2026-06-28_funds_add_contact_and_timestamps.sql` — idempotent (`ADD COLUMN IF NOT EXISTS`) + backfill cho dòng cũ. File này gộp chung 2 cột timestamps với cột `manager_email` (xem `docs/plan_fund_manager_contact.md`).

### 2.2. Entity — `Funds.java` (BẮT BUỘC)

File: `backend/src/main/java/com/service/backend/shared/entity/Funds.java`

Thêm import:

```java
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
```

Thêm 2 field vào cuối class (giống `ForumTopic`):

```java
    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
```

> `LocalDateTime` đã được import sẵn trong file. Spring Data R2DBC sẽ tự gán `createdAt` khi insert và cập nhật `updatedAt` mỗi lần `save()` (nhờ `@EnableR2dbcAuditing` đã bật).

### 2.3. KHÔNG cần đụng tới

- **API response**: bỏ qua — không expose `createdAt`/`updatedAt` ra client, nên **không** sửa `FundDetailResponse`, `FundListItemResponse`, `FundService`, `FundR2dbcRepository`.
- `CreateFundRequest` / `UpdateFundRequest`: timestamp do hệ thống tự sinh, **không** nhận từ client.
- `FundService.createFund()`: **không** cần set thủ công timestamp (auditing tự lo).
- Config / `BackendApplication.java`: đã bật auditing rồi.
- Frontend: không liên quan.

## 3. Thứ tự thực hiện

1. Sửa `docs/postgre.sql` (mục 2.1) + tạo/cập nhật migration file `2026-06-28_funds_add_contact_and_timestamps.sql`.
2. Sửa `Funds.java` (mục 2.2).
3. Áp DB: chạy migration trên DB đang có, hoặc `docker compose down/up` (xoá volume) để dựng lại từ schema mới ở dev.
4. Build & chạy lại backend.

## 4. Kiểm thử / xác minh

- **Insert**: Tạo 1 quỹ mới qua `POST /api/funds` → kiểm tra trực tiếp trong DB (`SELECT created_at, updated_at FROM funds`) thấy 2 cột được set tự động.
- **Update**: Gọi `PUT /api/funds/{id}` → trong DB `updated_at` thay đổi, `created_at` giữ nguyên.

## 5. Rủi ro & lưu ý

- Vì DB được nạp lại từ `docs/postgre.sql` khi recreate, **dữ liệu hiện có sẽ mất** nếu xoá volume — chỉ phù hợp môi trường dev. Cân nhắc kỹ trước khi làm trên môi trường có dữ liệu thật.
- Đảm bảo `docs/postgre.sql` đúng là file được docker compose dùng để init DB (kiểm tra mount/initdb trong `docker-compose.yml`).
