# Plan: Áp dụng Flyway cho backend (R2DBC + PostgreSQL)

> Trạng thái: **ĐÃ TRIỂN KHAI trong repo — chờ deploy prod.**
> Quyết định đã chốt: (1) Baseline dựng từ `pg_dump` **prod**; (2) Flyway **chỉ quản schema**, mọi seed data xử lý ngoài Flyway.

## Đã làm (repo)
- `pom.xml`: `flyway-core` + `flyway-database-postgresql`.
- `application.properties` / `application-prod.properties`: `spring.flyway.*` (JDBC riêng, `baseline-on-migrate=true`, `baseline-version=1`), giữ nguyên `spring.r2dbc.*`.
- `backend/src/main/resources/db/migration/V1__baseline.sql`: dump schema-only từ prod (55 bảng, đã bỏ `\restrict`/`\unrestrict` — lệnh psql không hợp lệ qua JDBC). Đã gồm `CREATE EXTENSION pg_trgm`, không có `OWNER TO`/`CREATE SCHEMA`.
- `docker-compose.yml`: gỡ mount `postgre.sql`/`sample.sql`; **bump `postgres:15` → `postgres:16`** cho khớp prod (prod = 16.14). ⚠️ Nâng version cần recreate volume local: `docker compose down -v`.

## Đã kiểm thử (Flyway 12.11 thật, PG16 container tạm)
- **DB rỗng:** V1 chạy → 55 bảng + `flyway_schema_history`. ✓
- **DB đã có schema, chưa có history (mô phỏng prod):** Flyway baseline V1, **không** chạy lại V1, schema nguyên vẹn. ✓ → adopt prod phi phá huỷ.

## Phát hiện
- Prod chạy **PostgreSQL 16.14** (không phải 15 như docker-compose cũ).
- `postgre.sql` cũ đã drift (thiếu `device_tokens`); baseline lấy từ prod nên đầy đủ. Bảng survey thực tên `survey_forms`/`survey_submissions` (có trong prod).

## Còn lại (cần bạn làm)
1. **Deploy prod**: build + deploy backend. Lần khởi động đầu Flyway tự tạo `flyway_schema_history` và baseline V1 (không đụng data). Nên **backup prod** trước.
2. **Dev seed**: `docs/sample.sql` không còn tự nạp. Nạp thủ công khi cần:
   `docker exec -i db psql -U user -d db < docs/sample.sql`
3. Cân nhắc cơ chế seed reference-data bắt buộc cho DB mới (xem §6).

---

### (Kế hoạch gốc bên dưới)

---

## 1. Bối cảnh & hiện trạng

| Thành phần | Hiện trạng |
|---|---|
| Stack DB | **R2DBC + WebFlux (reactive)**, Spring Boot 3.5.9, Java 17, PostgreSQL 15 |
| Driver có sẵn | `org.postgresql:postgresql` (JDBC, runtime) + `r2dbc-postgresql` (runtime) |
| Schema chuẩn | `docs/postgre.sql` (~1102 dòng), mount vào `docker-entrypoint-initdb.d/01-init.sql` |
| Seed | `docs/sample.sql`, mount làm `02-sample.sql` |
| Delta thủ công | `docs/migrations/YYYY-MM-DD_*.sql` — apply **bằng tay**, không có bảng version |
| Versioning | **Không có** (chưa dùng Flyway/Liquibase) |

### Vấn đề đã phát hiện
- **`docs/postgre.sql` đã drift** so với DB thật:
  - Thiếu bảng `device_tokens` (có ở migration `2026-07-13`).
  - Thiếu bảng `surveys` (có ở `survey_tables.sql`).
  - Có **0 câu `INSERT`** → seed bắt buộc (vd. `email_templates`) chỉ nằm trong migration/`sample.sql`.
- ⇒ **Không dùng `postgre.sql` làm baseline.** Baseline phải lấy từ DB prod thật.

### Ràng buộc kỹ thuật cốt lõi
> **Flyway chạy trên JDBC, KHÔNG hỗ trợ R2DBC.**
App runtime vẫn dùng R2DBC; Flyway cần **datasource JDBC riêng** chỉ để chạy migration lúc khởi động. Spring Boot hỗ trợ sẵn: chỉ cần khai báo `spring.flyway.url/user/password` (JDBC) — `FlywayAutoConfiguration` tự dựng datasource độc lập từ các property này, **không cần** thêm JDBC starter hay bean `DataSource`. Driver `org.postgresql:postgresql` đã có trên classpath nên đủ điều kiện.

---

## 2. Chiến lược tổng thể

1. Flyway trở thành **nguồn sự thật duy nhất cho schema**; thay thế workflow `docs/migrations/*.sql` thủ công.
2. `V1__baseline.sql` = schema-only dump từ **prod** (đã phản ánh mọi delta lịch sử).
3. Các DB đang chạy (prod, local có data) được **baseline tại V1** (đánh dấu đã áp dụng, không thực thi lại).
4. DB trống mới → Flyway chạy V1 dựng toàn bộ schema.
5. **Seed data nằm ngoài Flyway** (đã chốt) — xử lý riêng cho dev; reference data bắt buộc cho prod xử lý thủ công/script (xem §6 rủi ro).
6. Từ V1 trở đi: mỗi thay đổi schema = một file `V{n}__mô_tả.sql`.

---

## 3. Các Phase triển khai

### Phase 0 — Dựng baseline chuẩn từ prod  ⚠️ *bước cần cẩn thận nhất*
```bash
# Chạy từ máy có quyền truy cập DB prod (168.144.42.193). BACKUP trước.
pg_dump \
  --schema-only --no-owner --no-privileges \
  -h 168.144.42.193 -p 5432 -U postgres -d postgres \
  > backend/src/main/resources/db/migration/V1__baseline.sql
```
- `--no-owner`: bỏ các dòng `ALTER ... OWNER TO postgres` (không cần và dễ fail ở môi trường khác).
- `--schema-only`: không kèm data (đúng với quyết định "seed ngoài Flyway").
- Review V1 thủ công: bỏ `CREATE SCHEMA public` nếu gây lỗi "already exists"; đảm bảo có extension cần thiết (vd. `pg_trgm` cho các index `gin_trgm_ops` — thêm `CREATE EXTENSION IF NOT EXISTS pg_trgm;` ở đầu file nếu dump chưa có).
- ✅ Checkpoint: V1 phải khớp 100% schema prod. So khớp lại số bảng/cột với DB thật.

### Phase 1 — Thêm dependency (`backend/pom.xml`)
```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```
- Version do Spring Boot 3.5.9 BOM quản (không hardcode).
- Boot 3.5.x → Flyway 11.x, **bắt buộc** module `flyway-database-postgresql` riêng.

### Phase 2 — Cấu hình Flyway (JDBC riêng, song song R2DBC)
**`application.properties`** (dev) — giữ nguyên toàn bộ block `spring.r2dbc.*`, thêm:
```properties
# Flyway (JDBC riêng — R2DBC không chạy được migration)
spring.flyway.enabled=true
spring.flyway.url=jdbc:postgresql://127.0.0.1:5432/db
spring.flyway.user=user
spring.flyway.password=123
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-on-migrate=true
spring.flyway.baseline-version=1
spring.flyway.baseline-description=baseline from prod dump
```
**`application-prod.properties`** — tương tự nhưng trỏ prod (nên lấy qua biến môi trường/`.env`, không hardcode mật khẩu):
```properties
spring.flyway.url=jdbc:postgresql://168.144.42.193:5432/postgres
spring.flyway.user=${DB_USERNAME}
spring.flyway.password=${DB_PASSWORD}
```
- `baseline-on-migrate=true`: lần chạy đầu trên DB **không rỗng & chưa có** `flyway_schema_history` → Flyway tạo history và baseline tại `baseline-version`, đánh dấu V1 "đã áp dụng" mà **không thực thi**. Trên DB **rỗng** → Flyway chạy V1 bình thường. Đúng cho cả hai trường hợp.

### Phase 3 — Bố trí file migration
```
backend/src/main/resources/db/migration/
└── V1__baseline.sql          # schema-only từ prod
# V2__*.sql, V3__*.sql ... cho các thay đổi TƯƠNG LAI
```
- Toàn bộ `docs/migrations/*.sql` lịch sử **đã** nằm trong V1 (vì dump từ prod) → không chuyển thành V2+. Giữ lại `docs/migrations/` như tài liệu lịch sử hoặc archive.

### Phase 4 — Baseline các DB đang chạy
- **Prod**: BACKUP → deploy bản có Flyway → lần khởi động đầu, `baseline-on-migrate` tự tạo `flyway_schema_history` + baseline V1. (Hoặc chủ động chạy `flyway:baseline` qua Maven plugin trước.)
- **Local (có data)**: tương tự, tự baseline.
- **Local (muốn sạch)**: xoá volume `db_data` → Flyway chạy V1 dựng mới.

### Phase 5 — Dọn docker & tài liệu
- **`docker-compose.yml`**: gỡ 2 dòng mount trong service `db`:
  ```yaml
  # BỎ 2 dòng này — Flyway thay thế init thủ công:
  # - ./docs/postgre.sql:/docker-entrypoint-initdb.d/01-init.sql
  # - ./docs/sample.sql:/docker-entrypoint-initdb.d/02-sample.sql
  ```
- Seed dev (`sample.sql`): chuyển thành bước riêng — script dev chạy tay hoặc profile dev — **không** cho vào prod.
- Cập nhật doc: quy ước đặt tên `V{major}__snake_case_description.sql`, cấm sửa file migration đã merge (chỉ thêm mới).

---

## 4. Thứ tự thực thi lúc khởi động (kiểm chứng an toàn với WebFlux)
Flyway chạy đồng bộ tại thời điểm khởi tạo context (qua JDBC), **trước** khi app phục vụ request. R2DBC/WebFlux hoàn toàn không liên quan tới bước migration này → an toàn, không xung đột.

---

## 5. Checklist review trước khi code
- [ ] Có quyền `pg_dump` prod + đã backup.
- [ ] Xác nhận cách truyền credential prod (env/`.env`) — không commit mật khẩu.
- [ ] Chốt cách seed reference data bắt buộc cho DB mới (§6).
- [ ] Quyết định giữ hay archive `docs/migrations/`.

## 6. Rủi ro & lưu ý
| Rủi ro | Giảm thiểu |
|---|---|
| Baseline sai → Flyway tạo bảng đã tồn tại, fail khi khởi động | Dump đúng từ prod; verify khớp; `baseline-on-migrate=true` |
| **Seed reference bắt buộc bị mất trên DB mới** (do seed ngoài Flyway) — vd. `email_templates`, cấu hình mặc định | Cần script seed riêng (dev + prod) chạy sau migration; ghi rõ trong README. **Đây là hệ quả trực tiếp của quyết định "seed ngoài Flyway" — cần một cơ chế seed đáng tin.** |
| Thiếu extension `pg_trgm` trên DB mới | Thêm `CREATE EXTENSION IF NOT EXISTS pg_trgm;` đầu V1 |
| Mật khẩu prod hardcode trong properties | Dùng biến môi trường |
| Migration cũ không idempotent | Không vấn đề — đã gộp vào baseline, không chạy lại |
| DB prod đang có kết nối khi migrate | Flyway lock schema history; chạy vào cửa sổ bảo trì |

## 7. Ngoài phạm vi (lần sau)
- Chuyển reference-data seed thành cơ chế versioned (Flyway repeatable `R__` hoặc bảng cấu hình).
- Tích hợp `flyway:validate` vào CI.
- Migration test với Testcontainers.
