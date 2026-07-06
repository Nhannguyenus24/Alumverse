# Plan: Phân quyền chỉnh sửa Quỹ theo vai trò (STAFF vs ADMIN)

> Ngày tạo: 2026-07-05 · Cập nhật: 2026-07-06 (đã chốt các quyết định mục 6; sửa lại mục "tên" → `managerName` thay vì `name`)
> Mục tiêu:
> - **Giáo vụ (STAFF)**: chỉ được **sửa** 3 trường của quỹ — **email** (`managerEmail`), **tên** (`managerName` — tên **người quản lý/phụ trách quỹ**, KHÔNG phải `name` là tiêu đề quỹ), **bài viết/mô tả đầy đủ** (`descriptionFull`). **Không** được tạo quỹ, đóng quỹ, hay sửa bất kỳ trường nào khác.
> - **ADMIN (super admin)**: sửa **mọi thứ** của quỹ (giữ nguyên hành vi hiện tại).
>
> **Quyết định đã chốt** (chi tiết mục 6):
> - **Org-scoping (6.1):** JWT **có** claim `organizationId` → STAFF **chỉ sửa được quỹ thuộc tổ chức của mình**; nếu org của STAFF null thì fail-safe (từ chối).
> - **Quỹ đã kết thúc (6.2):** khi quỹ đã kết thúc, **không ai** (kể cả ADMIN) sửa được gì. STAFF chỉ sửa khi quỹ **chưa** kết thúc.
> - **Phạm vi (6.3):** STAFF = **chỉ sửa, chỉ 3 trường**; ADMIN = **toàn quyền**. Đổi cả backend lẫn frontend theo đúng vậy.
> - **Mobile (6.4):** app mobile không có phạm vi ADMIN/STAFF → **ngoài phạm vi**.

## 0. Làm rõ thuật ngữ (đọc trước)

- **"Giáo vụ" trong yêu cầu = role `STAFF`.** Codebase **không** có role tên "Giáo vụ" — chỉ có 3 role trong `UserRole` (`ADMIN`, `USER`, `STAFF`). STAFF hiển thị nhãn tiếng Việt là **"Cán bộ"**. "Giáo vụ" chỉ xuất hiện dưới dạng email liên hệ cứng `giaovu@hcmus.edu.vn` trong `donation.json`. → **Không tạo role mới**, dùng thẳng `STAFF`.
- **"super admin" = role `ADMIN`.** Không có `SUPER_ADMIN`; `ADMIN` đã là role cao nhất.
- **"email" của quỹ = `managerEmail`** (cột `manager_email`). Bảng `funds` không có cột `email` nào khác (email của người donate nằm ở bảng `fund_donations`, không liên quan).
- **"tên" mà STAFF được sửa = `managerName`** (cột `manager_name` — tên người quản lý/phụ trách quỹ, hiển thị ở label "Người quản lí" trên form). **KHÔNG phải** `name` (cột `name` — tiêu đề/tên quỹ, hiển thị ở label "Tên quỹ quyên góp"). Hai cột này **rất dễ nhầm** vì cả hai đều dịch là "tên"; bản nháp đầu của kế hoạch này đã nhầm sang `name` — đã sửa lại. `name` (tiêu đề quỹ) **chỉ ADMIN** mới được sửa.
- **"article" = `descriptionFull`** (cột `description_full`, nội dung HTML soạn bằng WYSIWYG). Khác với `descriptionShort` (mô tả ngắn ≤100 ký tự) — **`descriptionShort` KHÔNG nằm trong quyền của STAFF**.

## 1. Ma trận quyền (permission matrix)

| Hành động | Endpoint hiện tại | ADMIN | STAFF | Ghi chú |
|---|---|---|---|---|
| Tạo quỹ | `POST /api/funds` | ✅ | ❌ | Hiện `hasAnyRole('ADMIN','STAFF')` → **siết còn ADMIN** |
| Đóng quỹ | `PUT /api/funds/{id}/close` | ✅ | ❌ | Hiện `hasAnyRole('ADMIN','STAFF')` → **siết còn ADMIN** |
| Sửa toàn bộ quỹ | `PUT /api/funds/{id}` | ✅ | ❌ | Hiện `hasAnyRole('ADMIN','STAFF')` → **siết còn ADMIN** |
| Sửa `managerName` + `managerEmail` + `descriptionFull` | *(endpoint mới)* | ✅ | ✅ | Xem 3.1 |
| Xem danh sách / chi tiết / thống kê | các `GET` | ✅ | ✅ | Public, không đổi |

Ba trường STAFF được sửa: **`managerName`, `managerEmail`, `descriptionFull`**. Mọi trường khác (`name`, `descriptionShort`, `logoUrl`, `targetAmount`, `fundReceivingInfoId`, `timeStarted`, `timeEnded`, `topic`, `organizationId`) chỉ ADMIN mới được đụng.

## 2. Hiện trạng (rất quan trọng — có "lệch" giữa BE và FE)

### 2.1. Backend (`hasAnyRole('ADMIN','STAFF')` ở mọi thao tác ghi)

`backend/src/main/java/com/service/backend/fundraising/controller/FundController.java`:

```java
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')") @PostMapping                     // createFund
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')") @PutMapping("/{fundId}")         // updateFund
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')") @PutMapping("/{fundId}/close")   // closeFund
```

→ Backend **hiện đã cho STAFF làm mọi thứ** (tạo/sửa toàn bộ/đóng). Đây chính là chỗ cần siết.

- `UpdateFundRequest` là **payload "full replace"**: hầu hết trường `@NotBlank`/`@NotNull` (`name`, `descriptionShort`, `descriptionFull`, `managerName`, `managerEmail`, `targetAmount`, `fundReceivingInfoId`, `timeStarted`, `timeEnded`). → Không thể "sửa 1 trường" bằng DTO này.
- `FundService.updateFund` (`FundService.java:329`) có logic kiểm tra vòng đời phức tạp theo thời gian (before_start / active / ended) nhưng **không** có kiểm tra vai trò và **không** có kiểm tra quyền sở hữu tổ chức (`organizationId`) → **bất kỳ STAFF nào cũng sửa được quỹ của bất kỳ tổ chức nào** (xem Rủi ro 6.1).

### 2.2. Frontend (chặn STAFF hoàn toàn — ngược với backend)

- Route sửa quỹ **chỉ cho ADMIN**: `frontend/src/routes/index.jsx:848`
  ```jsx
  { path: ":id/edit", element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}><EditDonationPage /></ProtectedRoute>) }
  ```
- Route tạo quỹ **chỉ cho ADMIN**: `frontend/src/routes/index.jsx:514` (`post/donation`, `allowedRoles={["ADMIN"]}`).
- Nút "Sửa quỹ" / "Quản lý quỹ" chỉ hiện khi `isAdmin`: `frontend/src/pages/donation/DonationArticlePage.jsx:45` (`const isAdmin = isAuthenticated && user?.role === "ADMIN"`).
- Form sửa `EditDonationPage.jsx` **chưa có** logic theo vai trò — chỉ disable field theo *phase* của quỹ (`disableAllFields`, `disableStartDate`, ... `EditDonationPage.jsx:287-291`).
- Vai trò lấy từ JWT claim `role` → `useAuth().user.role` (Zustand `authStore`). Không có helper `isAdmin/hasRole` tập trung; mọi nơi tự so `user?.role === 'ADMIN'`.

**Kết luận hiện trạng:** hôm nay STAFF **không vào được** trang sửa quỹ qua UI, nhưng API backend lại cho phép. Feature này = **mở một lối sửa hẹp cho STAFF** (3 trường) + **siết backend** để đúng least-privilege.

## 3. Thiết kế đề xuất

### 3.1. Hướng chọn: **endpoint riêng cho sửa hạn chế** (khuyến nghị)

Thêm 1 endpoint nhỏ, gọn cho việc sửa 3 trường, tách khỏi PUT "full replace":

- **`PATCH /api/funds/{fundId}/basic-info`** — `@PreAuthorize("hasAnyRole('ADMIN','STAFF')")`.
- DTO mới `UpdateFundBasicInfoRequest { managerName, managerEmail, descriptionFull }` (chỉ 3 trường, đều validate).
- **Đồng thời siết `PUT /api/funds/{fundId}` (full) về `hasRole('ADMIN')`** — nếu để STAFF còn quyền gọi PUT full thì STAFF có thể **bypass** giới hạn 3 trường bằng cách gọi thẳng PUT. Đây là điểm bảo mật bắt buộc.

**Vì sao chọn hướng này** (thay vì nhét logic vai trò vào PUT hiện có — *Hướng B*):
- STAFF không phải gửi cả payload đầy đủ (targetAmount, times, receivingInfo...) chỉ để sửa 1 dòng chữ.
- Ranh giới quyền do `@PreAuthorize` ở tầng endpoint lo — dễ đọc, khó sai. PUT full = ADMIN, PATCH basic-info = ADMIN/STAFF.
- Đúng nguyên tắc "một hàm một việc" (`CODING_GUIDELINE` §4.1): không trộn 2 luồng quyền trong 1 service method.
- Không phá logic vòng đời thời gian phức tạp đang có trong `updateFund`.

> **Hướng B (thay thế, không khuyến nghị):** giữ nguyên 1 `PUT`, trong `FundService.updateFund` đọc vai trò bằng `SecurityUtils.hasRole("ADMIN")`; nếu STAFF thì chỉ set `managerName/managerEmail/descriptionFull`, bỏ qua các trường khác. Nhược điểm: `UpdateFundRequest` vẫn bắt buộc mọi trường → STAFF vẫn phải gửi payload đầy đủ hợp lệ; dễ rối và dễ hở nếu quên chặn 1 trường. Chỉ nên chọn nếu muốn tránh thêm endpoint.

### 3.2. Vòng đời quỹ khi STAFF sửa 3 trường (đã chốt)

**Quỹ đã kết thúc → khoá hoàn toàn, không ai sửa được (kể cả ADMIN).** STAFF chỉ sửa được khi quỹ **chưa** kết thúc.

- Service `updateFundBasicInfo` **phải** kiểm tra phase "ended" y hệt `updateFund` và ném `FUND_ALREADY_ENDED` cho **mọi** caller nếu quỹ đã kết thúc.
- Các phase khác (`before_start`, `active`): STAFF sửa 3 trường bình thường (3 trường này không đụng thời gian/tài chính nên không cần các ràng buộc `FUND_TIME_TOO_EARLY`/`FUND_TARGET_AMOUNT_UPDATE_NOT_ALLOWED`... của `updateFund`).
- Logic tính "ended" tái dùng đúng cách `updateFund` đang làm: `oldStart.isBefore(oldEnd) && oldEnd.isBefore(now)`.

## 4. Thay đổi Backend

### 4.1. `FundController.java` — siết quyền + thêm endmpoint

File: `backend/src/main/java/com/service/backend/fundraising/controller/FundController.java`

1. `createFund` (POST): đổi `@PreAuthorize("hasAnyRole('ADMIN','STAFF')")` → **`@PreAuthorize("hasRole('ADMIN')")`**.
2. `closeFund` (`PUT /{fundId}/close`): đổi → **`@PreAuthorize("hasRole('ADMIN')")`**.
3. `updateFund` (`PUT /{fundId}`): đổi → **`@PreAuthorize("hasRole('ADMIN')")`** (full replace giờ chỉ ADMIN).
4. Thêm endpoint mới:

```java
@PrivateEndpoint
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
@PatchMapping("/{fundId}/basic-info")
public Mono<ResponseEntity<ApiResponse<Funds>>> updateFundBasicInfo(
        @PathVariable @Min(1) Long fundId,
        @Valid @RequestBody UpdateFundBasicInfoRequest request) {
    return fundService.updateFundBasicInfo(fundId, request)
            .map(updated -> ResponseEntity.ok(
                    new ApiResponse<>("Fund basic info updated successfully", updated)));
}
```

> `hasRole('ADMIN')` đã được dùng ở nơi khác trong dự án nên cú pháp/pattern đã có sẵn.

### 4.2. DTO mới — `UpdateFundBasicInfoRequest.java`

File mới: `backend/src/main/java/com/service/backend/fundraising/dto/UpdateFundBasicInfoRequest.java`

```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UpdateFundBasicInfoRequest {
    @NotBlank @Size(max = 255)
    private String managerName;

    @NotBlank @Email
    private String managerEmail;

    @NotBlank
    @JsonProperty("description_full")
    private String descriptionFull;
}
```

> Giữ đúng convention JSON hiện có: `descriptionFull` map `description_full` (giống `UpdateFundRequest`). `managerName`, `managerEmail` để camelCase (giống payload frontend đang gửi).

### 4.3. `FundService.updateFundBasicInfo(...)` — chỉ set 3 trường

File: `backend/src/main/java/com/service/backend/fundraising/service/FundService.java`

```java
public Mono<Funds> updateFundBasicInfo(Long fundId, UpdateFundBasicInfoRequest request) {
    // getCurrentOrganizationId() rỗng khi org null (VD: ADMIN đăng nhập global) → map về null
    return Mono.zip(
            SecurityUtils.getCurrentUserRole(),
            SecurityUtils.getCurrentOrganizationId().map(Optional::of).defaultIfEmpty(Optional.empty()))
        .flatMap(ctx -> {
            String role = ctx.getT1();
            Integer currentOrgId = ctx.getT2().orElse(null);
            boolean isStaff = "STAFF".equalsIgnoreCase(role);
            return fundR2dbcRepository.findById(fundId)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.FUND_NOT_FOUND, "Fund not found with id: " + fundId)))
                .flatMap(existing -> {
                    // (6.1) STAFF chỉ sửa quỹ thuộc tổ chức của mình; org null → fail-safe (từ chối).
                    // ADMIN bỏ qua check này (toàn quyền, org có thể null).
                    if (isStaff && (currentOrgId == null
                            || !existing.getOrganizationId().equals(currentOrgId))) {
                        return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN));
                    }

                    // (6.2) Quỹ đã kết thúc → không ai sửa được, kể cả ADMIN.
                    LocalDateTime now = LocalDateTime.now();
                    boolean isEnded = existing.getTimeStarted().isBefore(existing.getTimeEnded())
                            && existing.getTimeEnded().isBefore(now);
                    if (isEnded) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.FUND_ALREADY_ENDED,
                                "Quỹ đã kết thúc, không thể chỉnh sửa bất kì cái gì"));
                    }

                    // Chỉ set 3 trường; mọi trường khác giữ nguyên giá trị existing.
                    existing.setManagerName(request.getManagerName());
                    existing.setManagerEmail(request.getManagerEmail());
                    existing.setDescriptionFull(request.getDescriptionFull());
                    return fundR2dbcRepository.save(existing);
                });
        });
}
```

- Dùng `SecurityUtils.getCurrentUserRole()` / `getCurrentOrganizationId()` — helper **đã có sẵn** (`shared/utils/SecurityUtils.java`), `EventService` đã dùng đúng pattern này.
- **Org guard (6.1):** đã xác nhận JWT có claim `organizationId` (set trong `JwtUtils.generateAccessToken`, đọc lại ở `SecurityConfig`). STAFF đăng nhập theo tổ chức nên token luôn có org; nếu vì lý do gì đó null → từ chối (fail-safe). ADMIN có thể có org null (đăng nhập global) nên **không** áp check này cho ADMIN.
- **Ended guard (6.2):** chặn cho mọi vai trò khi quỹ đã kết thúc, tái dùng đúng công thức `isEnded` của `updateFund`.
- **Chỉ** set 3 trường; mọi trường khác giữ nguyên giá trị `existing`.
- Cần thêm import `java.util.Optional` nếu chưa có (đã import sẵn trong `FundService`).

### 4.4. Không cần đụng

- `CreateFundRequest`, `UpdateFundRequest`, logic `createFund`/`updateFund`/`closeFund` — giữ nguyên (chỉ đổi annotation quyền ở controller).
- Schema DB / migration — **không** thay đổi cột nào (dùng lại cột sẵn có). → **Không cần migration file.**

### 4.5. Test backend

- `backend/src/test/java/com/service/backend/fundraising/service/FundServiceTest.java`: thêm test cho `updateFundBasicInfo`:
  - chỉ 3 trường đổi, các trường khác giữ nguyên;
  - STAFF khác org → `FORBIDDEN`; STAFF org null → `FORBIDDEN`; ADMIN không bị org-check;
  - quỹ đã kết thúc → `FUND_ALREADY_ENDED` cho cả STAFF lẫn ADMIN.
- Cân nhắc test tầng controller (quyền): STAFF gọi `POST/PUT(full)/close` → 403; STAFF gọi `PATCH /basic-info` → 200.

## 5. Thay đổi Frontend

### 5.1. Route — cho STAFF vào trang sửa

File: `frontend/src/routes/index.jsx`

- Dòng ~848 (`donations/:id/edit`): `allowedRoles={["ADMIN"]}` → **`allowedRoles={["ADMIN", "STAFF"]}`**.
- Dòng ~514 (`post/donation` — tạo quỹ): **giữ `allowedRoles={["ADMIN"]}`** (STAFF không được tạo).

> `ProtectedRoute` đã tự chặn STAFF sang tổ chức khác qua slug (`ProtectedRoute.jsx`: STAFF + slug + org mismatch → `/unauthorized`) — hỗ trợ 6.1 ở tầng UI, nhưng **vẫn cần** guard backend 4.3 vì API có thể bị gọi trực tiếp.

### 5.2. `EditDonationPage.jsx` — form theo vai trò

File: `frontend/src/pages/admin/EditDonationPage.jsx`

- Lấy vai trò: `const { user } = useAuth(); const isStaff = user?.role === "STAFF";`
- **STAFF:** chỉ cho sửa `managerName`, `managerEmail`, `descriptionFull`; **disable** (hoặc ẩn) mọi field còn lại (`name` — tiêu đề quỹ, logo, `descriptionShort`, `targetAmount`, `fundReceivingInfoId`, `startDate`, `endDate`). Cách gọn nhất: thêm cờ `const lockForStaff = isStaff;` và OR vào các `disable*` sẵn có; giữ 3 field mục tiêu không bị `lockForStaff`. **Lưu ý:** field khoá cho STAFF là `name` (tiêu đề quỹ) chứ **không phải** `managerName` — dễ nhầm vì cả hai UI field đều liên quan đến "tên".
- **`onSubmit` phân nhánh theo vai trò:**
  - STAFF → gọi endpoint mới, payload gọn:
    ```js
    await fundApi.updateFundBasicInfo(id, {
      managerName: values.managerName?.trim(),
      managerEmail: values.managerEmail?.trim(),
      description_full: values.descriptionFull,
    });
    ```
  - ADMIN → giữ nguyên `fundApi.updateFund(id, payload)` (full).
- Zod schema: với STAFF, các field bị khoá không cần validate (chúng disabled và không gửi đi). Có thể tách schema tối giản cho STAFF hoặc giữ schema đủ nhưng prefill từ `getFundDetail` (an toàn vì không submit).
- Hiển thị 1 banner/note cho STAFF: "Bạn chỉ có thể chỉnh sửa Người quản lý, Email liên hệ và Nội dung bài viết của quỹ." (i18n) — dùng chữ "Người quản lý" thay vì "Tên" để khớp đúng label hiển thị trên form (`donation:manager_label`) và tránh nhầm với tiêu đề quỹ.
- **Quỹ đã kết thúc (6.2):** cờ sẵn có `disableAllFields = phase === "ended"` (`EditDonationPage.jsx:287`) đã **khoá toàn bộ** form khi quỹ kết thúc — áp dụng luôn cho STAFF, không cần thêm gì; backend vẫn chặn `FUND_ALREADY_ENDED` như lớp phòng thủ thứ hai. `lockForStaff` chỉ OR thêm vào các field ngoài 3 field mục tiêu, **không** ghi đè `disableAllFields`.

### 5.3. `src/utils/api.js` — thêm hàm gọi API

Trong `fundApi` (~dòng 826–891) thêm:

```js
updateFundBasicInfo: (id, payload) =>
  apiClient.patch(`/funds/${id}/basic-info`, payload).then((r) => r.data?.data),
```

### 5.4. Nút "Sửa" — hiện cho STAFF; "Quản lý"/"Đóng"/"Tạo" giữ ADMIN

File: `frontend/src/pages/donation/DonationArticlePage.jsx` (~dòng 45, 125–148)

- Tách quyền:
  - `const canEditFund = role === "ADMIN" || role === "STAFF";` → điều kiện hiển thị nút **"Sửa quỹ"**.
  - `const isAdmin = role === "ADMIN";` (giữ) → nút **"Quản lý quỹ"**, **"Đóng quỹ"**, và mọi thao tác khác vẫn chỉ ADMIN.
- Rà các nơi truyền prop `isAdmin` cho card (`ArticleDonationCard.jsx`, `FeaturedArticleDonationCard.jsx`) để nút edit hiện đúng cho STAFF nhưng nút close/tạo thì không. Nếu cần, thêm prop `canEdit` tách khỏi `isAdmin`.
- **Nút "Tạo quỹ"** (nếu có ở list/admin) giữ **ADMIN-only**.

### 5.5. (Tùy chọn, khuyến nghị) helper quyền tập trung

Frontend hiện rải rác `user?.role === 'ADMIN'`. Cân nhắc thêm `src/hooks/useFundPermissions.js` trả `{ canCreateFund, canEditFundBasicInfo, canEditFundFull, canCloseFund }` để tránh lệch logic ở nhiều nơi. Không bắt buộc cho v1 nhưng giảm rủi ro sai sót về sau.

### 5.6. `AdminFundraisingsPage.jsx` — ẩn nút "Đóng quỹ"/"Tạo quỹ" cho STAFF (frontend-only)

File: `frontend/src/pages/admin/AdminFundraisingsPage.jsx` (route `/admin/donations`, `allowedRoles={["ADMIN","STAFF"]}` — STAFF đã vào được trang này từ trước, không liên quan thay đổi ở mục 5.1).

**Phát hiện khi review:** trang này dùng bảng (`AdminDataTable`) chứ không dùng `ArticleDonationCard`/`FeaturedArticleDonationCard` (đã xử lý ở 5.4), nên không nằm trong phạm vi rà soát ban đầu của 5.4. Nút **"Tạo quỹ"** (header, dòng ~342-349) và icon **"Đóng quỹ"** (cột actions, dòng ~295-314) hiện **không lọc theo vai trò** — hiển thị cho cả STAFF. Sau khi backend siết `POST /api/funds` và `PUT /api/funds/{id}/close` về `hasRole('ADMIN')` (mục 4.1), STAFF bấm 2 nút này sẽ nhận lỗi 403 từ API thay vì không thấy nút — không sai về bảo mật (backend đã chặn) nhưng sai về least-privilege UX. Nút **"Sửa"** (icon edit, dòng ~285-294) giữ nguyên hiển thị cho cả 2 vai trò (đúng theo 5.1/5.2, STAFF sửa 3 trường qua `/donations/:id/edit`).

**Đây là thay đổi frontend-only** — không đụng backend (backend đã đúng từ mục 4.1), không đụng API mới.

- Lấy vai trò: `const { user } = useAuth();` (đã dùng đúng pattern ở `DonationPage.jsx`/`DonationArticlePage.jsx`), `const isAdmin = user?.role === "ADMIN";`.
- Nút **"Tạo quỹ"** (header): bọc trong `{isAdmin && (...)}`.
- Icon **"Đóng quỹ"** (cột actions): chỉ render khi `isAdmin`; STAFF không thấy icon này (kể cả icon ẩn dùng cho spacing khi quỹ đã ended) — thay bằng không render gì hoặc giữ ô trống cùng kích thước để không lệch layout cột actions.
- Icon **"Sửa"**: không đổi, vẫn hiện cho cả ADMIN và STAFF.
- Modal "Đóng quỹ sớm" (`closeTarget` dialog, dòng ~538-602): không cần đổi logic, vì trigger duy nhất (icon đóng quỹ) đã bị ẩn khỏi STAFF.

## 6. Quyết định đã chốt & rủi ro còn lại

### 6.1. (Đã chốt) STAFF bị giới hạn theo tổ chức — **CÓ**

Backend `updateFund` hiện **không** kiểm tra `fund.organizationId` → bất kỳ STAFF nào cũng sửa được quỹ tổ chức khác khi gọi API trực tiếp. **Đã xác nhận qua code là feasible và sẽ vá:**
- JWT **có** claim `organizationId`: set ở `JwtUtils.generateAccessToken(user, organizationId)` (`shared/utils/JwtUtils.java:72`), đọc lại ở `SecurityConfig` (`config/SecurityConfig.java:105-117`, đưa vào `auth.setDetails`), lấy ra qua `SecurityUtils.getCurrentOrganizationId()`.
- STAFF đăng nhập **theo tổ chức** (login kèm `organizationId`) nên token STAFF **luôn** có org; frontend `ProtectedRoute` cũng đã dựa vào `user.organizationId` cho STAFF.
- **ADMIN đăng nhập global có thể có `organizationId = null`** (`AuthController.java:323-325`) → vì vậy **chỉ** áp org-check cho STAFF, ADMIN bỏ qua.
- **Fail-safe:** nếu STAFF mà org null → từ chối (`FORBIDDEN`).
- Mỗi quỹ có `organizationId` xác định (cột NOT NULL) → so sánh an toàn.

→ Đã hiện thực trong `updateFundBasicInfo` (mục 4.3).

### 6.2. (Đã chốt) Quỹ đã kết thúc → khoá hoàn toàn

Khi quỹ **đã kết thúc**, **không ai** (kể cả ADMIN) sửa được gì. STAFF chỉ sửa 3 trường khi quỹ **chưa** kết thúc. → `updateFundBasicInfo` ném `FUND_ALREADY_ENDED` khi phát hiện phase "ended" (mục 3.2, 4.3). Nhất quán với `updateFund` (đã khoá ended sẵn cho ADMIN).

### 6.3. (Đã chốt) Phạm vi quyền

STAFF = **chỉ sửa, chỉ 3 trường** (`name`, `managerEmail`, `descriptionFull`). ADMIN = **toàn quyền** (tạo/sửa-full/đóng). Đổi **cả backend lẫn frontend** đúng theo mô hình này (mục 4, 5). Đây là hành vi mong muốn — không phải sửa "bug", mà là siết backend cho khớp least-privilege và mở lối sửa hẹp cho STAFF ở frontend.

### 6.4. (Đã chốt) Mobile ngoài phạm vi

App `mobile_flutter/` **không có** phạm vi ADMIN/STAFF cho quản trị quỹ → **không đụng tới**, không cần cập nhật.

### 6.5. (Lưu ý khi code) `MODERATOR` "ma"

`AdminForumController` và vài route FE tham chiếu role `'MODERATOR'` **không tồn tại** trong `UserRole` enum. Không liên quan feature này, nhưng khi copy pattern `@PreAuthorize` **chỉ dùng `ADMIN`/`STAFF`** — đừng vô tình thêm `MODERATOR`.

### 6.6. Không có migration / thay đổi schema

Feature thuần phân quyền, dùng lại cột sẵn có → **không** sửa `docs/postgre.sql`, **không** tạo migration.

### 6.7. (Đã chốt) Client khác đang gọi endpoint bị siết?

Sau thay đổi, STAFF gọi `POST /api/funds`, `PUT /api/funds/{id}` (full), `PUT /api/funds/{id}/close` sẽ nhận **403**. Web FE chặn STAFF ở các luồng này tại **mọi** nơi có nút bấm — kể cả `AdminFundraisingsPage.jsx` (mục 5.6, phát hiện sau khi rà lại vì trang này không dùng chung component card với `DonationPage.jsx`). Mobile đã xác nhận ngoài phạm vi (6.4). Chỉ cần lưu ý nếu về sau có script/tích hợp ngoài dựa vào quyền STAFF cũ.

## 7. Thứ tự thực hiện

1. **Backend**: tạo `UpdateFundBasicInfoRequest` (4.2) → thêm `FundService.updateFundBasicInfo` (4.3) → sửa `@PreAuthorize` + thêm `@PatchMapping` trong `FundController` (4.1).
2. **Backend test**: `FundServiceTest` cho luồng mới + kiểm 403 (4.5).
3. **Frontend**: `fundApi.updateFundBasicInfo` (5.3) → mở route STAFF (5.1) → form theo vai trò trong `EditDonationPage` (5.2) → nút "Sửa" cho STAFF (5.4) → ẩn "Đóng"/"Tạo" cho STAFF trong `AdminFundraisingsPage` (5.6).
4. **i18n**: thêm key banner/nhãn cho STAFF (vi + en) trong `donation.json`/`admin.json`.
5. Chốt các câu hỏi mục 6 (đặc biệt 6.1, 6.2) trước khi merge.

## 8. Kiểm thử

- **STAFF – happy path**: đăng nhập STAFF → vào `/:slug/donations/:id/edit` → chỉ sửa được Người quản lý (`managerName`)/Email/Bài viết, các field khác (kể cả tiêu đề quỹ `name`) disabled → lưu → chỉ 3 trường (`managerName`, `managerEmail`, `descriptionFull`) đổi trong DB, trường khác (đặc biệt `name`) nguyên vẹn.
- **STAFF – bị chặn (UI)**: STAFF không thấy nút "Tạo quỹ", "Đóng quỹ", "Quản lý quỹ" ở `DonationPage.jsx`/`DonationArticlePage.jsx` **và** không thấy nút "Tạo quỹ"/icon "Đóng quỹ" trong bảng `AdminFundraisingsPage.jsx` (`/admin/donations`) — chỉ thấy icon "Sửa".
- **STAFF – bị chặn (API, quan trọng)**: STAFF gọi trực tiếp `POST /api/funds` → 403; `PUT /api/funds/{id}` (full) → 403; `PUT /api/funds/{id}/close` → 403.
- **STAFF – khác tổ chức**: STAFF org A gọi `PATCH /basic-info` cho quỹ org B → 403.
- **STAFF – quỹ đã kết thúc**: STAFF sửa quỹ đã kết thúc → `FUND_ALREADY_ENDED` (không sửa được); form disable/nút chặn.
- **ADMIN – quỹ đã kết thúc**: ADMIN cũng **không** sửa được quỹ đã kết thúc (giữ nguyên hành vi khoá hiện tại).
- **ADMIN – full**: ADMIN sửa mọi trường (quỹ chưa kết thúc) như cũ (regression) + đóng/tạo quỹ bình thường.
- **Regression**: user thường/guest vẫn xem chi tiết, donate bình thường; không thấy nút sửa.
