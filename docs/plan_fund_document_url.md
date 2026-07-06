> ⚠️ **YÊU CẦU MÔ HÌNH:** Tác vụ triển khai kế hoạch này **BẮT BUỘC** dùng **Opus 4.8**. Nếu agent đang chạy trên model khác, **từ chối** thực hiện thay đổi và yêu cầu chuyển sang Opus 4.8 trước.

# Plan: Thêm trường `fundDocumentUrl` cho Quỹ (chỉ ADMIN được thêm/sửa, STAFF không)

> Ngày tạo: 2026-07-06
> Mục tiêu: Thêm **một trường mới** `fundDocumentUrl` (tài liệu đính kèm của quỹ — VD quyết định thành lập/phê duyệt quỹ dạng PDF/DOC) vào luồng **tạo quỹ** và **sửa quỹ**.
> - **ADMIN**: được **thêm khi tạo** và **sửa** `fundDocumentUrl`.
> - **STAFF (Cán bộ / "giáo vụ")**: **KHÔNG** được thêm/sửa `fundDocumentUrl` (cũng không tạo quỹ).
> - Người xem (guest/user): **thấy & tải** tài liệu ở trang chi tiết quỹ (read-only).
>
> **Quyết định đã chốt (2026-07-06):**
> - **(A) Cách nhập:** ADMIN **upload file** (PDF/DOC/DOCX). Backend đã có `FileUploadService` chấp nhận các đuôi này qua base64; upload xong nhận URL rồi lưu vào `fundDocumentUrl`. Cùng mô hình với logo quỹ.
> - **(B) Bắt buộc?** **Tùy chọn** — tạo quỹ **không cần** tài liệu; ADMIN có thể bổ sung sau qua sửa quỹ. Cột **nullable**, **không** `@NotBlank`.

## 0. Quan hệ với `plan_fund_role_based_edit.md` (đọc trước)

Kế hoạch này **ăn khớp** với `docs/plan_fund_role_based_edit.md` và **dựa vào** mô hình phân quyền đã chốt ở đó:

- **Tạo quỹ** (`POST /api/funds`) và **sửa full** (`PUT /api/funds/{id}`) → **chỉ ADMIN**.
- **STAFF chỉ sửa 3 trường** qua endpoint hẹp `PATCH /api/funds/{id}/basic-info` với DTO `UpdateFundBasicInfoRequest` (`managerName`, `managerEmail`, `descriptionFull`).

→ **Điểm mấu chốt để STAFF không sửa được `fundDocumentUrl`:** chỉ cần **KHÔNG** thêm `fundDocumentUrl` vào `UpdateFundBasicInfoRequest` (endpoint của STAFF). Trường mới **chỉ** xuất hiện trong `CreateFundRequest` và `UpdateFundRequest` — cả hai đều là endpoint ADMIN-only. Ranh giới quyền do `@PreAuthorize` ở tầng endpoint đảm bảo, **không** cần thêm check vai trò trong service cho trường này.

> **Phụ thuộc thứ tự:** phần siết `@PreAuthorize` về `hasRole('ADMIN')` cho create/update-full là **nội dung của `plan_fund_role_based_edit.md`**. Nếu kế hoạch đó chưa merge, cần đảm bảo nó merge trước (hoặc thực hiện chung) — nếu không, STAFF vẫn gọi được `PUT full` và qua đó sửa được `fundDocumentUrl`. Xem Rủi ro 6.1.

## 1. Ma trận quyền cho `fundDocumentUrl`

| Hành động | Endpoint | ADMIN | STAFF | Ghi chú |
|---|---|---|---|---|
| Thêm `fundDocumentUrl` khi tạo quỹ | `POST /api/funds` | ✅ | ❌ | STAFF không tạo quỹ (theo role-based plan) |
| Sửa `fundDocumentUrl` | `PUT /api/funds/{id}` (full) | ✅ | ❌ | Full-edit là ADMIN-only |
| Sửa 3 trường (không gồm document) | `PATCH /api/funds/{id}/basic-info` | ✅ | ✅ | **Không** thêm `fundDocumentUrl` vào DTO này |
| Xem/tải tài liệu | các `GET` chi tiết | ✅ | ✅ | Public read-only |

## 2. Hiện trạng (đã xác nhận qua code)

- **Chưa có** cột/field `fundDocumentUrl` ở bất kỳ đâu (DB, entity, DTO, FE). Đây là trường **mới hoàn toàn**.
- **DB:** bảng `funds` (`docs/postgre.sql:582`) — các cột hiện có là text, không có cột tài liệu.
- **Entity:** `Funds` (`backend/src/main/java/com/service/backend/shared/entity/Funds.java`) — dùng annotation `@Column("...")` map snake_case.
- **DTO tạo:** `CreateFundRequest` — có sẵn field `logoUrl` + `logoBase64` (mô hình upload để tham chiếu). `managerName`, `logoUrl` là **optional** (không `@NotBlank`).
- **DTO sửa full:** `UpdateFundRequest`.
- **DTO sửa hẹp (STAFF):** `UpdateFundBasicInfoRequest` — **chỉ** 3 trường. → nơi **cố tình KHÔNG đụng**.
- **Service tạo:** `FundService.createFund` (`FundService.java:71`) — build `Funds` bằng builder; logo qua `imageService.uploadBase64IfPresent(request.getLogoBase64())` rồi fallback `logoUrl`.
- **Service sửa full:** `FundService.updateFund` (`FundService.java:329`).
- **Response chi tiết:** `FundDetailResponse` + `FundDetailResponse.from(...)` — nơi map field ra cho FE hiển thị.
- **Upload file:** backend có `FileUploadService.uploadBase64File(base64, originalFileName)` chấp nhận `pdf/doc/docx` (đuôi trong `DOC_EXTENSIONS`), giới hạn kích thước theo đuôi. FE đã có endpoint `/files/upload` nhận `{ base64String, fileName }` (dùng ở `api.js:445` `uploadChatMedia`).
- **FE tạo quỹ:** `frontend/src/pages/user/PostArticleDonationPage.jsx` (route `post/donation`, ADMIN-only) — build `payload` ở `onSubmit` (dòng ~192), upload logo bằng `uploadLogo(logoFile)` trước khi gửi.
- **FE sửa quỹ:** `frontend/src/pages/admin/EditDonationPage.jsx` — theo role-based plan sẽ có cờ `lockForStaff` để khoá các field ngoài 3 trường của STAFF.
- **FE hiển thị chi tiết:** `frontend/src/pages/donation/DonationArticlePage.jsx`.

## 3. Thay đổi Backend

### 3.1. Migration / schema DB — **CÓ** (khác role-based plan)

Khác với `plan_fund_role_based_edit.md` (không cần migration), trường này là cột **mới** → cần thêm cột.

- Cập nhật `docs/postgre.sql` (bảng `funds`, sau `manager_email`):
  ```sql
  fund_document_url      text
  ```
- Thêm migration/DDL áp lên DB đang chạy:
  ```sql
  ALTER TABLE funds ADD COLUMN IF NOT EXISTS fund_document_url text;
  ```
  > Cột **nullable** (tùy chọn) → an toàn với các quỹ cũ. Đặt migration theo cơ chế migration hiện dùng của dự án (kiểm tra thư mục migration nếu có; nếu dự án chỉ dùng `postgre.sql` thủ công thì chạy `ALTER TABLE` trực tiếp trên DB dev/stage/prod).

### 3.2. Entity `Funds.java` — thêm field

File: `backend/src/main/java/com/service/backend/shared/entity/Funds.java`

```java
@Column("fund_document_url")
private String fundDocumentUrl;
```

### 3.3. `CreateFundRequest.java` — thêm field (optional, có upload base64)

File: `backend/src/main/java/com/service/backend/fundraising/dto/CreateFundRequest.java`

```java
@Size(max = 500)
@Schema(example = "https://example.com/funds/quyet-dinh-thanh-lap.pdf")
private String fundDocumentUrl;

/** Optional base64-encoded fund document (pdf/doc/docx). When present, backend uploads and stores the resulting URL. */
private String fundDocumentBase64;

/** Original filename (needed to resolve extension for pdf/doc/docx upload). */
private String fundDocumentFileName;
```

- **Không** `@NotBlank` → tùy chọn (quyết định B).
- `fundDocumentBase64` + `fundDocumentFileName` đi cùng nhau vì `FileUploadService` cần `originalFileName` để suy ra đuôi & giới hạn kích thước (khác `ImageService.uploadBase64IfPresent` chỉ nhận base64). Nếu FE tự upload trước và chỉ gửi URL thì 2 field base64 có thể để trống — xem 3.6 để chọn cách.

### 3.4. `UpdateFundRequest.java` — thêm field (ADMIN sửa full)

File: `backend/src/main/java/com/service/backend/fundraising/dto/UpdateFundRequest.java`

```java
@Size(max = 500)
@Schema(example = "https://example.com/funds/quyet-dinh-thanh-lap.pdf")
private String fundDocumentUrl;
```

- Sửa full là ADMIN-only → thêm thẳng, không cần cờ vai trò.
- (Tùy chọn) thêm `fundDocumentBase64` + `fundDocumentFileName` nếu muốn cho phép upload-khi-sửa qua backend giống create; hoặc để FE upload trước rồi chỉ gửi `fundDocumentUrl` (xem 3.6).

### 3.5. `UpdateFundBasicInfoRequest.java` — **KHÔNG đụng** (điểm cốt lõi)

File: `backend/src/main/java/com/service/backend/fundraising/dto/UpdateFundBasicInfoRequest.java`

- **Giữ nguyên** 3 trường (`managerName`, `managerEmail`, `descriptionFull`). **Tuyệt đối không** thêm `fundDocumentUrl` ở đây — đây chính là cơ chế khiến STAFF không sửa được tài liệu. STAFF chỉ có endpoint này để ghi, mà endpoint này không biết tới `fundDocumentUrl` → dù STAFF gửi kèm cũng bị bỏ qua (không có field để bind).

### 3.6. `FundService` — set field khi tạo & sửa

File: `backend/src/main/java/com/service/backend/fundraising/service/FundService.java`

**Chọn 1 trong 2 cách upload** (khuyến nghị Cách 1 để đồng nhất với logo hiện tại):

**Cách 1 — Backend upload (giống logo):** trong `createFund` (và `updateFund`), nếu có `fundDocumentBase64` thì gọi `fileUploadService.uploadBase64File(base64, fileName)` để lấy URL, fallback về `fundDocumentUrl` nếu không có base64.

```java
// createFund: sau khi resolve logoUrl, resolve thêm documentUrl rồi build.
// (inject FileUploadService fileUploadService vào FundService nếu chưa có)
Mono<String> documentUrlMono =
        (request.getFundDocumentBase64() != null && !request.getFundDocumentBase64().isBlank())
            ? fileUploadService.uploadBase64File(
                    request.getFundDocumentBase64(), request.getFundDocumentFileName())
            : Mono.justOrEmpty(request.getFundDocumentUrl()).defaultIfEmpty("");
// ...zip với logoUrl, rồi:
.fundDocumentUrl(documentUrl.isEmpty() ? null : documentUrl)
```

Trong `updateFund` (`FundService.java:401-422`): set `fundDocumentUrl` theo **đúng pattern null-guard của `logoUrl`** (`FundService.java:411-413`) — **KHÔNG** set vô điều kiện:

```java
String newDocUrl = request.getFundDocumentUrl();
if (newDocUrl != null) {
    existing.setFundDocumentUrl(newDocUrl.isEmpty() ? null : newDocUrl);
}
```

- `null` (FE bỏ qua field) → **giữ nguyên** tài liệu hiện có → **không** có rủi ro vô tình xoá dù FE quên prefill.
- Chuỗi rỗng `""` → **chủ động gỡ** tài liệu.

> **Quan trọng — `updateFund` KHÔNG phải "full replace" thuần.** Nhìn code thực tế: `logoUrl` và `topic` được **null-guard** (omit = giữ nguyên), còn các field `@NotBlank`/`@NotNull` (name, times, targetAmount...) bị ghi đè nhưng FE **buộc** phải gửi giá trị hợp lệ nên không thể mất. Vì vậy `fundDocumentUrl` chỉ cần theo nhóm null-guard là an toàn.

**Cách 2 — FE upload trước:** FE gọi `/files/upload` lấy URL, chỉ gửi `fundDocumentUrl` trong payload; service chỉ cần `.fundDocumentUrl(request.getFundDocumentUrl())` / `existing.setFundDocumentUrl(request.getFundDocumentUrl())`. Đơn giản hơn ở backend, không cần inject `FileUploadService` vào `FundService`, nhưng logic upload nằm ở FE. **Khuyến nghị Cách 2** vì FE đã có sẵn `/files/upload` (`uploadChatMedia` pattern) và tránh sửa chữ ký zip trong `createFund`.

> **Chốt khuyến nghị:** dùng **Cách 2** — FE upload document qua `/files/upload` rồi gửi `fundDocumentUrl`. Khi đó **bỏ** `fundDocumentBase64`/`fundDocumentFileName` khỏi DTO ở 3.3/3.4, chỉ giữ `fundDocumentUrl`. Ít thay đổi backend nhất, đồng bộ với cách chat media đang làm.

### 3.7. `FundDetailResponse` + mapper — lộ field ra FE

File: `backend/src/main/java/com/service/backend/fundraising/dto/FundDetailResponse.java`

- Thêm `private String fundDocumentUrl;`
- Trong `from(...)`: `.fundDocumentUrl(fund.getFundDocumentUrl())`.
- Kiểm tra thêm `FundListItemResponse`/`FundDonationMapper` nếu muốn hiện tài liệu ở danh sách (thường **không cần** ở list, chỉ ở chi tiết → có thể bỏ qua).

### 3.8. Test backend

File: `backend/src/test/java/com/service/backend/fundraising/service/FundServiceTest.java`

- `createFund`: có `fundDocumentUrl` → lưu đúng; không có → `null` (không lỗi vì optional).
- `updateFund` (ADMIN full): đổi `fundDocumentUrl`; gửi rỗng → gỡ tài liệu (xác nhận hành vi mong muốn).
- **Bảo mật (quan trọng):** `updateFundBasicInfo` (đường của STAFF) **không** thay đổi `fundDocumentUrl` — kể cả nếu request JSON có kèm khoá `fundDocumentUrl`, giá trị `existing.fundDocumentUrl` phải giữ nguyên (vì DTO không có field để bind). Viết 1 test khẳng định điều này.

## 4. Thay đổi Frontend

### 4.1. Trang tạo quỹ `PostArticleDonationPage.jsx` (ADMIN-only)

File: `frontend/src/pages/user/PostArticleDonationPage.jsx`

- Thêm UI upload tài liệu (input file chấp nhận `.pdf,.doc,.docx`), tương tự khối logo. Hiển thị tên file đã chọn + nút gỡ.
- Trong `onSubmit` (dòng ~183): trước khi build payload, nếu có file tài liệu → upload lấy URL:
  ```js
  const fundDocumentUrl = documentFile
    ? await uploadFundDocument(documentFile)   // gọi /files/upload → trả URL
    : null;
  // ...
  const payload = {
    ...,
    fundDocumentUrl,   // optional
  };
  ```
- Zod schema: `fundDocumentUrl`/file **optional** (không thêm rule bắt buộc). Có thể validate đuôi & kích thước file phía FE trước khi upload (giống `validateImageFile`, nhưng cho tài liệu — kiểm `pdf/doc/docx`).
- Route giữ **ADMIN-only** (STAFF không tạo quỹ) — không đổi.

### 4.2. Trang sửa quỹ `EditDonationPage.jsx` (ADMIN sửa, STAFF bị khoá)

File: `frontend/src/pages/admin/EditDonationPage.jsx`

- **Prefill** `fundDocumentUrl` từ `getFundDetail` (hiện tên file/link tải hiện tại).
- Thêm khối upload/thay tài liệu **giống trang tạo**.
- **STAFF không được sửa:** dùng cờ `lockForStaff` (đã có trong role-based plan) → **disable/ẩn** khối tài liệu cho STAFF, giống các field ngoài 3 trường của STAFF. STAFF vẫn **thấy** (read-only) link tải nếu muốn, nhưng **không** có nút thay/xoá.
- `onSubmit` (ADMIN, luồng `updateFund` full): thêm `fundDocumentUrl` vào payload. **Luôn** gửi URL hiện tại nếu không đổi (vì `updateFund` là full-replace, gửi thiếu = gỡ tài liệu — xem 3.6).
- STAFF submit vẫn đi `updateFundBasicInfo` (3 trường) → không mang `fundDocumentUrl`.

### 4.3. `src/utils/api.js` — helper upload tài liệu (nếu chọn Cách 2)

- Tái dùng endpoint có sẵn `/files/upload`:
  ```js
  async uploadFundDocument({ base64String, fileName }) {
    const response = await apiClient.post('/files/upload', { base64String, fileName });
    return unwrap(response); // trả URL
  }
  ```
  (hoặc dùng lại `uploadChatMedia` nếu muốn, nhưng đặt tên riêng cho rõ ngữ cảnh.)
- `createFund`/`updateFund` payload đã đi qua `useCreateFund`/`fundApi.updateFund` — chỉ cần thêm khoá `fundDocumentUrl`, không đổi chữ ký.

### 4.4. Hiển thị tài liệu ở trang chi tiết `DonationArticlePage.jsx`

File: `frontend/src/pages/donation/DonationArticlePage.jsx`

- Nếu `fund.fundDocumentUrl` có giá trị → hiện nút/link **"Tài liệu quỹ"** (mở tab mới / tải xuống). Ẩn nếu null.
- Read-only cho mọi vai trò (kể cả guest/user).

### 4.5. i18n

Thêm key (vi + en) trong `donation.json`/`admin.json`:
- Nhãn field: "Tài liệu quỹ (PDF/DOC)" / "Fund document (PDF/DOC)".
- Placeholder/nút: "Tải tài liệu lên", "Thay tài liệu", "Xem tài liệu".
- Thông báo lỗi định dạng/kích thước file.

## 5. Không cần đụng

- `UpdateFundBasicInfoRequest` (STAFF) — **cố tình giữ nguyên** (mục 3.5).
- Logic phân quyền `@PreAuthorize` — đã do `plan_fund_role_based_edit.md` xử lý (create/update-full = ADMIN).
- Mobile `mobile_flutter/` — ngoài phạm vi (không có quản trị quỹ ADMIN/STAFF).

## 6. Rủi ro & quyết định

### 6.1. (Phụ thuộc) STAFF phải bị chặn khỏi `PUT full`

Cơ chế "STAFF không sửa được `fundDocumentUrl`" **chỉ đúng** khi `PUT /api/funds/{id}` (full, có chứa `fundDocumentUrl`) đã bị siết về `hasRole('ADMIN')` theo `plan_fund_role_based_edit.md`. **Nếu kế hoạch đó chưa áp dụng**, STAFF vẫn gọi được `PUT full` và set `fundDocumentUrl`. → **Thực hiện/merge role-based plan trước hoặc cùng lúc.** Nếu vì lý do gì đó chưa thể siết `PUT full`, cần chặn tạm bằng check vai trò trong `updateFund` cho riêng field này (kém sạch, chỉ là phương án dự phòng).

### 6.2. (Đã chốt) Upload file, tùy chọn

- Nhập bằng **upload** PDF/DOC/DOCX qua `/files/upload` (FE) → lưu `fundDocumentUrl`.
- **Tùy chọn**: cột nullable, không `@NotBlank`; tạo quỹ không cần tài liệu.

### 6.3. Rủi ro "gỡ nhầm tài liệu" — **thấp nếu dùng null-guard**

Ban đầu lo `updateFund` là "full replace" nên FE quên prefill sẽ xoá tài liệu. **Sau khi đọc code thật (`FundService.java:401-422`): rủi ro này gần như bị loại bỏ nếu set field theo pattern null-guard của `logoUrl`** (mục 3.6): `null` = giữ nguyên, `""` = gỡ có chủ đích. Khi đó FE **không bắt buộc** phải prefill để tránh mất dữ liệu (dù prefill vẫn nên làm để ADMIN thấy tài liệu hiện tại).

- **KHÔNG** dùng `existing.setFundDocumentUrl(request.getFundDocumentUrl())` vô điều kiện — đó mới là nguồn rủi ro thật (omit → ghi `null` → mất tài liệu).
- `updateFund` **không** phải full-replace thuần: chỉ nhóm field `@NotBlank`/`@NotNull` bị ghi đè (FE buộc gửi hợp lệ), còn `logoUrl`/`topic` đã null-guard sẵn. `fundDocumentUrl` theo cùng nhóm null-guard là nhất quán và an toàn.

### 6.4. Giới hạn kích thước/định dạng

`FileUploadService` đã chặn đuôi ngoài `pdf/doc/docx` và có `MAX_BYTES_BY_EXTENSION`. FE nên validate trước khi upload để báo lỗi sớm, nhưng backend là lớp chặn cuối.

## 7. Thứ tự thực hiện

1. **DB:** `ALTER TABLE funds ADD COLUMN fund_document_url text;` + cập nhật `docs/postgre.sql` (3.1).
2. **Backend entity + DTO:** `Funds` (3.2), `CreateFundRequest` (3.3), `UpdateFundRequest` (3.4). **KHÔNG** đụng `UpdateFundBasicInfoRequest` (3.5).
3. **Backend service + response:** `FundService.createFund`/`updateFund` set field (3.6, Cách 2), `FundDetailResponse` + mapper (3.7).
4. **Backend test:** create/update lưu đúng; STAFF `basic-info` không đổi field (3.8).
5. **Frontend:** helper upload (4.3) → trang tạo (4.1) → trang sửa với `lockForStaff` (4.2) → hiển thị chi tiết (4.4).
6. **i18n:** thêm key vi/en (4.5).
7. Kiểm tra phụ thuộc 6.1 (role-based plan đã siết `PUT full` về ADMIN) trước khi merge.

## 8. Kiểm thử

- **ADMIN – tạo:** tạo quỹ có/không tài liệu → lưu đúng; không có tài liệu vẫn tạo được (optional).
- **ADMIN – sửa:** đổi tài liệu → cập nhật; sửa các field khác mà không đụng tài liệu → tài liệu **giữ nguyên** (prefill); chủ động gỡ tài liệu → thành `null`.
- **STAFF – bị chặn (UI):** form sửa của STAFF không có nút thay/xoá tài liệu (chỉ có thể thấy link, read-only).
- **STAFF – bị chặn (API, quan trọng):** STAFF gọi `PATCH /basic-info` kèm khoá `fundDocumentUrl` → tài liệu **không đổi**. STAFF gọi `PUT full`/`POST` → 403 (theo role-based plan).
- **Hiển thị:** guest/user thấy & tải được tài liệu ở trang chi tiết khi quỹ có tài liệu; không thấy gì khi null.
- **Định dạng/kích thước:** upload sai đuôi (VD `.exe`) hoặc quá lớn → bị `FileUploadService` từ chối, FE báo lỗi.
- **Regression:** các luồng tạo/sửa/đóng/donate hiện tại không đổi hành vi.
