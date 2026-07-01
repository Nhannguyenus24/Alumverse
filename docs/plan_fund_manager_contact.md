# Plan: Người liên hệ / phụ trách cho mỗi Quỹ (Fund Manager Contact)

> Ngày tạo: 2026-06-27
> Feature tracker: C22 — "Mỗi quỹ thêm người liên hệ (chat trên AlumVerse nếu có, else email)".
> Mục đích: Người đóng góp liên hệ đúng người phụ trách quỹ — nhắn tin nếu là thành viên hệ thống, nếu không thì hiển thị email.

## 1. Quyết định thiết kế (đã chốt qua thảo luận)

- **Chỉ lưu duy nhất 1 cột mới `manager_email`** (text, nullable) trong bảng `funds`.
- **KHÔNG lưu `manager_user_id` trong DB.** Field này được **tính lúc đọc**: endpoint chi tiết quỹ tra bảng `users` theo `manager_email`; nếu khớp → trả về `managerUserId = users.id`, không khớp → `null`.
- Frontend dựa vào `managerUserId`:
  - `!= null` → hiển thị email + **nút "Nhắn tin"**.
  - `== null` → chỉ hiển thị email (không có nút).

**Lý do chọn hướng này** (so với lưu cứng `manager_user_id`):
- Đơn giản: lúc tạo/sửa quỹ chỉ cần lưu email, không phải tra user.
- Tự lành (self-healing): nếu người phụ trách đăng ký tài khoản bằng đúng email *sau này* → nút Nhắn tin tự xuất hiện, không cần sửa quỹ.
- Đánh đổi đã chấp nhận: nếu người phụ trách **đổi email** trong hệ thống thì mất khớp → mất nút (hiếm gặp, OK cho v1).

## 2. Backend

### 2.1. Schema — `docs/postgre.sql`

Thêm cột vào `CREATE TABLE "funds"`:

```sql
  "topic" text,
  "time_ended" timestamp,
  "manager_email" text NOT NULL   -- thêm, BẮT BUỘC
```

> **Migration**: ngoài việc sửa `postgre.sql`, **bắt buộc tạo migration file** trong `docs/migrations/` cho thay đổi này (xem 2.5). Đã gộp chung với cột timestamps thành 1 file: `docs/migrations/2026-06-28_funds_add_contact_and_timestamps.sql`.
>
> **Lưu ý NOT NULL:**
> - `manager_email` bắt buộc — mọi quỹ phải có. Form tạo quỹ phải validate required (xem 3.1).
> - NOT NULL **không** chặn chuỗi rỗng `""`; việc đảm bảo là email hợp lệ do form lo (zod `.email()` + required).
> - Nếu trong `postgre.sql` có sẵn câu `INSERT` seed quỹ thì các dòng đó **phải có `manager_email`**, không thì insert lỗi.

### 2.2. Entity — `Funds.java`

`backend/.../shared/entity/Funds.java`, thêm field:

```java
    @Column("manager_email")
    private String managerEmail;
```

### 2.3. Request DTO — nhận `managerEmail` từ form

- `CreateFundRequest.java`: thêm `private String managerEmail;`
- `UpdateFundRequest.java`: thêm `private String managerEmail;`
- `FundService.createFund()` / `updateFund()`: set `.managerEmail(request.getManagerEmail().trim())`.
- Nên validate bắt buộc ở DTO (`@NotBlank` + `@Email`) để chặn sớm trước khi chạm DB (NOT NULL).

> Không validate "phải là user hệ thống" — cho phép cả email ngoài hệ thống (đúng nhánh "else email"), chỉ bắt buộc *có* và *đúng định dạng* email.

### 2.4. Response — trả `managerEmail` + `managerUserId` (derived)

File: `FundDetailResponse.java` — thêm:

```java
    private String managerEmail;
    private Integer managerUserId;    // null nếu email không khớp user nào
    private String managerAvatarUrl;  // chỉ lấy từ bảng users (avatar_url)
```

Trong `FundService.getFundDetail()`:
1. Lấy `fund.getManagerEmail()` — vì cột NOT NULL + form validate required, **luôn có email hợp lệ**, không cần guard rỗng → query thẳng.
2. Query `users` theo email (reactive, vd `userRepository.findByEmail(email)`):
   - tìm thấy → `managerUserId = user.getId()`, `managerAvatarUrl = user.getAvatarUrl()`.
   - không thấy → `managerUserId = null`, `managerAvatarUrl = null`.
3. Set `managerEmail`, `managerUserId`, `managerAvatarUrl` vào response.

> **Quyết định đã chốt:** chỉ lấy field có sẵn trong bảng `users` (`id`, `email`, `avatar_url`). **KHÔNG join `global_profiles`** → không trả tên (`full_name` nằm ở `global_profiles`). Drawer sẽ dùng tên fallback (xem 3.3).

**Cần kiểm tra khi code:**
- Có sẵn repository/hàm `findByEmail` cho user chưa; nếu chưa thì thêm.

> **Đã verify — không còn rủi ro user.id vs member id:** module chat dùng "memberId" chỉ là **alias của `users.id`** (vd `ChatConversationRequestRepository`: `WHERE target_member_id = :currentUserId`; `ChatWebSocketHandler` truyền `senderMemberId` thẳng vào `findByUserId`). Frontend `useNetworkCurrentMemberId` cũng trả thẳng `user.id`. Vì vậy `managerUserId` (= `users.id`) chính là id drawer cần (`peer.userId` / `targetMemberId`) — **không cần** trả thêm `managerMemberId`.

`FundListItemResponse`: **không cần** (chỉ làm ở trang chi tiết).

### 2.5. Migration file (BẮT BUỘC)

Mọi thay đổi schema phải có migration trong `docs/migrations/` theo convention `YYYY-MM-DD_description.sql`, idempotent (`ADD COLUMN IF NOT EXISTS`), khớp với `docs/postgre.sql`.

- File (gộp chung với cột timestamps): **`docs/migrations/2026-06-28_funds_add_contact_and_timestamps.sql`**.
- Phần `manager_email`: thêm cột nullable → backfill → `ALTER COLUMN ... SET NOT NULL` (không set NOT NULL trực tiếp được vì bảng có thể đã có dữ liệu).
- **Lưu ý dữ liệu thật**: backfill dùng placeholder `''` chỉ hợp cho dev; trên môi trường có quỹ thật phải thay bằng email phụ trách thực tế trước khi `SET NOT NULL`.

## 3. Frontend

### 3.1. Form tạo/sửa quỹ — thêm field `manager_email`

Hai file:
- Tạo: `frontend/src/pages/user/PostArticleDonationPage.jsx`
- Sửa: `frontend/src/pages/admin/EditDonationPage.jsx`

Cần làm ở mỗi file:
- Schema (zod) — **bắt buộc** (vì DB NOT NULL): `manager_email: z.string().trim().min(1, t('validation_manager_email_required')).email(t('validation_manager_email_invalid'))`
- `defaultValues`: `manager_email: ""` (form sửa: nạp từ `fundDetail.managerEmail`)
- TextField đánh dấu required (`required` / dấu `*`).
- Thêm `<Controller name="manager_email">` + `<TextField>` trong JSX (label/placeholder qua i18n).
- Payload gửi API: `managerEmail: values.manager_email.trim()` (bắt buộc, không để null).
- Hook liên quan: `useCreateFund.js` (POST /funds) và hàm update (PUT /funds/{id}) — bổ sung trường vào payload.

### 3.2. Trang chi tiết quỹ — hiển thị email + nút Kết nối

File hiển thị thông tin quỹ: `frontend/src/components/donation/DonationFundInfoPanel.jsx` (nhận prop `fundDetail`), nằm trong `pages/donation/DonationArticlePage.jsx`.

Thêm vào panel:
- Dòng email: `Email: {fundDetail?.managerEmail || "--"}` (luôn hiện vì email bắt buộc).
- Nút **"Kết nối"** (label thay cho "Nhắn tin", vì thực chất là gửi yêu cầu kết nối) — render **có điều kiện** theo bảng dưới.

**Điều kiện render nút (so `managerUserId` với `currentUserId` qua `useNetworkCurrentMemberId()`):**

| Trường hợp | Hiển thị |
|---|---|
| `managerUserId == null` (manager không phải user hệ thống) | Chỉ email, **không** nút |
| `managerUserId === currentUserId` (mình chính là người phụ trách) | Email + chip/dòng **"Bạn là người phụ trách quỹ này"**, **ẩn** nút Kết nối |
| `managerUserId != null` và khác mình | Email + nút **"Kết nối"** (mở drawer) |
| Chưa đăng nhập (`currentUserId == null`), `managerUserId != null` | **Vẫn hiện** nút "Kết nối"; bấm → nhắc/điều hướng đăng nhập (tận dụng cơ chế auth sẵn có) — hướng (a) |

> Case "mình là manager" nên xử lý ở frontend cho UX gọn. **Backend đã an toàn sẵn:** cả `createConversationRequest` lẫn `getConnectionStatus` (trong `ChatConversationRequestService`) đều chặn `currentMemberId == targetMemberId` và ném `BAD_REQUEST` ("Cannot send a conversation request to yourself"). Tức ẩn nút chỉ là tránh gây bối rối, không phải lỗ hổng — không cần thêm guard backend.

### 3.3. Tái sử dụng Drawer kết nối — KHÔNG viết mới

Drawer đã có sẵn và **dùng lại được**:

- Component: `frontend/src/components/network/NetworkMessageDrawer.jsx`
  - Props: `{ open, onClose, peer, connectionStatus }`
  - `connectionStatus`: lấy từ hook check status.
- `peer` các field drawer thực sự dùng (xác nhận trong code):
  - `peer.userId` — **bắt buộc**: gửi yêu cầu kết nối + check status.
  - `peer.fullName` — hiển thị tên, **có fallback** nếu thiếu → ta không truyền (vì không lấy `full_name`).
  - `peer.avatarUrl` — hiển thị avatar → lấy từ `managerAvatarUrl`.
  - `peer.program`, `peer.major` — chỉ hiển thị học vấn, **optional**, bỏ qua được.
- Hành vi đúng yêu cầu: bấm nút → thực chất **gửi yêu cầu kết nối** (`chatApi.createConversationRequest`), không phải chat trực tiếp.

#### 3.3.1. Bổ sung prop "variant" cho drawer (chỉnh nhẹ giao diện)

> **Làm rõ về "nút Nhắn tin":** bên trong `NetworkMessageDrawer` **không có nút chữ** — nút gửi chỉ là một `IconButton` + `SendIcon` (máy bay giấy, dòng ~246-262). Vì vậy việc đổi chữ "Nhắn tin → Kết nối" áp dụng cho **nút trigger trên trang donation** (nút mở drawer, mục 3.2). Trong drawer không có chữ để đổi; chỉ chỉnh placeholder/ngữ cảnh.

Drawer hiện có 4 phần: **header** (avatar + tên + ngành học) → **banner trạng thái kết nối** → **vùng tin nhắn** → **ô soạn + icon gửi**.

Để người dùng ở luồng quỹ không bị bất ngờ (họ đang xem quỹ, không phải trang network), thêm cho `NetworkMessageDrawer` prop điều chỉnh hiển thị:

- **Tên prop**: dạng tổng quát `variant` (`"default"` | `"connect"`) — **không** đặt `isUsedInFundDonation` (gắn cứng use-case, khó tái dùng). Kèm các prop override: `contextTitle`, `contextSubtitle`, `contextNote`.
- **BẮT BUỘC backward-compatible**: prop mới có **default = hành vi cũ**. Các chỗ đang dùng (`PublicUserProfile.jsx`, `NetworkPage.jsx`) **không cần đổi gì**.

**Khác biệt cụ thể khi `variant="connect"`** (bám theo từng phần đang có):

1. **Header** — hiện tại với luồng quỹ sẽ trống/lạ (không có `fullName` → fallback "(tên thành viên)"; `program/major` trống → header cụt):
   - Tiêu đề: `contextTitle` = "Người phụ trách quỹ" thay cho fallback chung.
   - Dòng phụ: `contextSubtitle` = **email manager** thay cho dòng ngành học trống.
2. **Dòng ngữ cảnh (`contextNote`)** — quan trọng nhất để chống bất ngờ: một `Alert` info riêng ở đầu, vd "Đây là yêu cầu kết nối — người phụ trách sẽ nhận và phản hồi, không phải tin nhắn tức thời." Đặt riêng, **không đè** banner trạng thái kết nối sẵn có.
3. **Placeholder ô soạn / empty hint**: chỉnh nhẹ kiểu "Nhập lời nhắn kèm yêu cầu kết nối…" (override qua prop, default giữ text network cũ). Icon gửi giữ nguyên.

- **Chỉ đổi phần hiển thị (text/banner), KHÔNG đụng logic** gửi yêu cầu / check status bên trong drawer.

Pattern gọi từ trang quỹ:

```text
<NetworkMessageDrawer
  open={drawerOpen}
  onClose={...}
  peer={peer}
  connectionStatus={connectionStatus}
  variant="connect"                       // mới — default giữ hành vi cũ
  contextTitle={t('...manager_title')}    // "Người phụ trách quỹ"
  contextSubtitle={fundDetail.managerEmail}
  contextNote={t('...connect_note')}      // giải thích đây là yêu cầu kết nối
/>
```

Pattern nối nút (theo `PublicUserProfile.jsx` / `NetworkPage.jsx`):

```text
handleMessage():
  status = await checkStatus(managerUserId)   // useCheckConversationRequestStatus
  setPeer({ userId: managerUserId, avatarUrl: fundDetail.managerAvatarUrl })
  setConnectionStatus(status)
  setDrawerOpen(true)
<NetworkMessageDrawer open={drawerOpen} onClose={...} peer={peer} connectionStatus={connectionStatus} />
```

Các hook tái dùng:
- `useCheckConversationRequestStatus` → `checkStatus(targetMemberId)`
- `useNetworkConversationActions(peerMemberId)` → `sendMessage` (drawer tự dùng bên trong)
- `useNetworkCurrentMemberId` → id người dùng hiện tại

**Nguồn dữ liệu `peer` (đã chốt):** lấy hết từ `FundDetailResponse`, **1 request, không gọi thêm API profile**:
- `peer.userId` = `managerUserId`
- `peer.avatarUrl` = `managerAvatarUrl`
- `peer.fullName`: **không truyền** → drawer tự dùng tên fallback (do không lấy `full_name` từ `global_profiles`).

## 4. Thứ tự thực hiện

1. Backend: `postgre.sql` + **migration file** (2.5) → `Funds.java` → Create/Update DTO + service set field.
2. Backend: `FundDetailResponse` + logic derive `managerUserId` + `managerAvatarUrl` (chỉ từ bảng `users`).
3. Áp DB: chạy migration `2026-06-28_funds_add_contact_and_timestamps.sql` (hoặc `docker compose` dựng lại DB ở môi trường dev).
4. Frontend: thêm field form (3.1).
5. Frontend: hiển thị email + nút Kết nối nối vào `NetworkMessageDrawer` (3.2, 3.3).
6. Frontend: thêm prop `variant` cho `NetworkMessageDrawer` (3.3.1) — giữ default = hành vi cũ.
7. i18n: thêm key label/placeholder/nút ("Kết nối", contextNote) cho các ngôn ngữ đang hỗ trợ.

## 5. Kiểm thử

- Tạo quỹ với email **là** thành viên hệ thống → trang chi tiết hiện email + nút **Kết nối** → bấm mở drawer (label/banner đúng variant), gửi được yêu cầu kết nối.
- Tạo quỹ với email **không** thuộc hệ thống → chỉ hiện email, không có nút.
- Sửa quỹ đổi email qua lại giữa 2 trường hợp → UI cập nhật đúng.
- Bỏ trống email → form chặn (required), không submit được.
- (Self-healing) Tạo quỹ với email chưa có tài khoản → sau đó tạo user bằng đúng email → reload chi tiết → nút Kết nối xuất hiện.
- **Mình là manager**: đăng nhập bằng đúng tài khoản manager → vào chi tiết quỹ → **không** thấy nút Kết nối, thấy chip "Bạn là người phụ trách quỹ này".
- **Chưa đăng nhập**: vào chi tiết quỹ có manager là user hệ thống → vẫn thấy nút Kết nối → bấm → nhắc/điều hướng đăng nhập.
- **Regression**: mở drawer từ trang network/profile cũ → giao diện & hành vi **không đổi** (variant default).

## 6. Rủi ro & điểm cần xác nhận

- ~~user id vs member id~~ — **đã verify**: "memberId" trong chat = `users.id`, nên `managerUserId` dùng trực tiếp được (xem 2.4).
- Đổi email của manager làm mất khớp (đã chấp nhận cho v1).
- Mỗi lần đọc chi tiết quỹ tốn thêm 1 query tra user theo email (nhẹ; cân nhắc index `users.email` nếu chưa có).
- Recreate DB sẽ mất dữ liệu nếu xoá volume — chỉ làm ở môi trường dev.
