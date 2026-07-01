# Nghiệp vụ Sự kiện (Event) & Check-in bằng QR

> Tài liệu mô tả nghiệp vụ **Sự kiện** hiện đang được implement trong hệ thống:
> vòng đời sự kiện, cơ chế đăng ký vé, cơ chế phát hành/đổi trạng thái vé, và
> **check-in bằng mã QR** (web nhập tay + mobile quét camera).
>
> Phạm vi code: `backend/` (Spring WebFlux + R2DBC), `frontend/` (React + MUI),
> `mobile_flutter/` (Flutter + Riverpod + Dio + go_router).
>
> Migration schema: [`migrations/2026-06-17_event_flow.sql`](./migrations/2026-06-17_event_flow.sql)

---

## 1. Tổng quan nghiệp vụ

Một **sự kiện** (`events`) do ADMIN/STAFF của một tổ chức (organization) tạo ra.
Người dùng có thể **quan tâm** (interest) hoặc **đăng ký tham dự**. Khi đăng ký
thành công, hệ thống phát hành một **vé** (`event_tickets`) có `ticket_code` duy
nhất. Tại sự kiện, ADMIN/STAFF **check-in** vé bằng cách quét QR (hoặc nhập mã).

Hai khái niệm cần phân biệt rõ:

| Khái niệm | Bảng | Ý nghĩa |
|---|---|---|
| **Interest** (quan tâm) | `event_interests` | Bấm "quan tâm", chỉ để theo dõi/đếm. **Không** tạo vé. |
| **Ticket** (vé) | `event_tickets` | Đăng ký tham dự thực sự → có vé + QR → mới check-in được. |

---

## 2. Mô hình dữ liệu (tables chính)

| Bảng | Vai trò | Cột quan trọng |
|---|---|---|
| `events` | Sự kiện | `is_published`, `max_capacity`, `start_time`, `registration_start_at/end_at`, `organization_id`, `creator_member_id`, `interested_count` |
| `event_interests` | Quan tâm | `event_id`, `member_id` |
| `event_invitations` | Lời mời | `token` (UUID), `email`, `member_id`, `status`, `expires_at` |
| `event_tickets` | Vé tham dự | `ticket_code`, `status`, `member_id`, `guest_name/email/phone`, `registration_answers` (text JSON), `checked_in_at`, `reviewed_by`, `cancel_reason` |
| `event_questions` | Câu hỏi đăng ký | `type` (TEXT/SINGLE_CHOICE/MULTI_CHOICE), `label`, `options`, `required`, `order_index` |
| `event_email_logs` | Log gửi email | `subject`, `template_name`, `recipient_count`, `sent_by` |

> ⚠️ `registration_answers` và `event_questions.options` lưu **text JSON** (không
> phải json/jsonb) — R2DBC map kiểu json gây lỗi 500. Xem ghi chú trong migration.

### Vòng đời trạng thái vé (`event_tickets.status`)

```
        register / confirm invitation
                    │
                    ▼
                 ISSUED ──check-in──► CHECKED_IN / USED
                    │
                  cancel
                    ▼
                CANCELLED
```

- **Tự đăng ký** (`registerForEvent`) và **xác nhận lời mời** tạo vé **thẳng ở
  `ISSUED`** → nghiệp vụ hiện tại **không bắt duyệt**.
- Check-in chấp nhận vé ở `ISSUED` (vẫn dung nạp `ACTIVE` nếu tồn tại từ dữ liệu cũ).
- Vé `CANCELLED`/`EXPIRED` không check-in được; `CHECKED_IN`/`USED` báo "đã check-in".
- Các trạng thái `PENDING`/`REJECTED`/`ACTIVE`/`EXPIRED` **không còn API tạo ra**
  sau khi gỡ luồng duyệt + activate/expire (xem [§6](#6-thay-đổi-đã-thực-hiện--ghi-chú-còn-lại)).
  Enum vẫn giữ để tương thích dữ liệu lịch sử.

---

## 3. Cơ chế đăng ký (2 đường vào → đều ra vé)

### Đường A — Lời mời (invitation)
1. **Mời**: ADMIN tạo `event_invitations` (token UUID, hết hạn 7 ngày) + gửi email & notification.
2. **Xác nhận**: người được mời mở link → `POST /api/events/invitations/confirm?token=...`
   → kiểm tra chưa dùng/chưa hết hạn → đổi invitation sang `CONFIRMED` → **phát hành vé**.

### Đường B — Tự đăng ký (self-register)
`POST /api/events/{eventId}/register`:
1. Chặn đăng ký trùng (`hasRegistered` — chỉ tính vé còn "active"; vé đã hủy thì cho đăng ký lại).
2. **Validate câu trả lời** (`validateRegistrationAnswers`): required, đúng option cho SINGLE/MULTI_CHOICE.
3. **Kiểm tra sức chứa** (`checkCapacityAndRegister`): nếu `max_capacity > 0` và đã đầy → `EVENT_FULLY_BOOKED`.
4. Sinh `ticket_code` = 8 ký tự hoa từ UUID, set `ISSUED`, lưu vé, gửi notification.

---

## 4. Cơ chế QR (mã hoá) & Check-in

### Sinh QR (phía người dùng) — **mã hoá phía server**
- QR vẫn **render trên client** (web: `qrcode.react`; mobile: `qr_flutter`),
  nhưng **nội dung do server cấp**: trường `qrToken` trong response của
  `my-tickets` / `tickets/code/{code}` / check-in.
- `qrToken` là một **JWE AES-256-GCM** (Nimbus, `dir` + `A256GCM`) bọc payload
  `{ tc: ticketCode, ev: eventId, exp }`, có prefix **`ALUMVERSE-TKT2-`**.
  - **Giấu** `ticket_code` (không còn đọc được từ QR).
  - **Chống giả mạo**: chỉ server (giữ khoá) mới tạo/đọc được token.
  - **Ràng buộc sự kiện + thời hạn**: token gắn `eventId` và `exp` (mặc định 30
    ngày, cấu hình `event.qr.ttl-days`); client lấy token mới mỗi lần mở vé nên
    tự gia hạn.
- Khoá được dẫn xuất từ `jwt.secret` qua SHA-256 (32 byte) → không cần cấp secret
  mới. Đổi `jwt.secret` sẽ vô hiệu các QR cũ (tự lành khi user mở lại vé).
- Vé cũ chưa có `qrToken` vẫn render fallback `ALUMVERSE-TICKET-{code}` (legacy).

`EventQrService` (`event/service/EventQrService.java`) lo việc encode/decode.

### Check-in (phía ADMIN/STAFF) — **event-scoped, verify ở server**
- **Web** (`AdminEventOrganizePage`): nhập/dán mã vé **hoặc** dán token QR vào ô
  text rồi check-in. Client tự nhận diện prefix (`TKT2-` → gửi `qrToken`,
  `TICKET-`/mã thường → gửi `code`).
- **Mobile** (`event_check_in_scanner_page`): **quét camera** → nếu là token
  `TKT2-` gửi nguyên `qrToken`; nếu là mã legacy/nhập tay gửi `code`. Có nhập tay
  dự phòng cho QR hỏng.
- Backend **`POST /api/events/{eventId}/tickets/check-in`** (body
  `{ qrToken? , code? }`):
  1. **Gate vai trò**: chỉ `ADMIN`/`STAFF`/`MODERATOR` (ném `FORBIDDEN`).
  2. Giải mã `qrToken` (hoặc dùng `code`), suy ra `ticketCode`.
  3. **So khớp sự kiện ở server**: token/vé phải thuộc `eventId` trên path,
     lệch → `TICKET_WRONG_EVENT` (không còn chỉ kiểm ở client).
  4. `CANCELLED`/`EXPIRED` → lỗi; `CHECKED_IN`/`USED` → "đã check-in";
     chỉ check-in khi `ISSUED`/`ACTIVE` → set `CHECKED_IN` + `checked_in_at`.
  5. **Trả về thông tin người tham dự** (`attendeeName`/`attendeeEmail`/
     `attendeeAvatarUrl`) để staff **đối chiếu/xác minh** ngay sau khi check-in.

### Hiển thị thông tin người tham dự (mới)
- Sau check-in, **web** hiện thẻ "Xác minh người tham dự" (avatar + tên + email +
  mã vé + giờ check-in); **mobile** hiện bottom-sheet với avatar + tên + email +
  trạng thái.
- Profile lấy từ bảng `users` qua `member_id` (`AttendeeLookupRepository`); response
  dùng DTO `EventTicketDetailResponse` thay cho entity trần.

---

## 5. File nào chịu trách nhiệm phần nào

### Backend (`backend/src/main/java/com/service/backend/event/`)

| File | Trách nhiệm |
|---|---|
| `controller/EventController.java` | REST endpoints user-facing: CRUD, publish, interest, invite, register, reminder, send-emails, **check-in (event-scoped)**, cancel, questions. |
| `service/EventService.java` | Toàn bộ nghiệp vụ: validate câu trả lời, sức chứa, vòng đời vé, **check-in + gate vai trò + enrich attendee**, gửi email/notification, thống kê. |
| `service/EventQrService.java` | **(mới)** Mã hoá/giải mã `qrToken` (JWE AES-256-GCM); validate `eventId`/`exp`. |
| `dao/AttendeeLookupRepository.java` | **(mới)** Tra cứu profile người tham dự (tên/email/avatar) theo `member_id`. |
| `dao/EventRepository.java` (impl `IEventRepository`) | Truy cập DB: sinh `ticket_code`, set trạng thái, query vé/sự kiện/lời mời. |
| `dao/Event*R2dbcRepository.java` | Spring Data R2DBC interfaces (event/ticket/interest/invitation/question/email-log). |
| `dto/EventTicketDetailResponse.java`, `CheckInRequest.java` | **(mới)** Response vé (kèm `qrToken` + attendee); body check-in (`qrToken`/`code`). |
| `dto/*` | Request/response DTO khác (CreateEvent, RegisterTicket, ReminderEmail, EventQuestion…). |
| `shared/entity/EventTicket.java`, `Event.java`, … | Entity map bảng; `EventTicket` serialize/deserialize `registration_answers`. |
| `admin/controller/AdminEventController.java` | Quản trị sự kiện theo tổ chức: list/search/by-status, tickets, statistics (dùng cho **picker** trên mobile). |
| `shared/enums/ErrorCode.java` | Mã lỗi nghiệp vụ: `TICKET_WRONG_EVENT`, `TICKET_QR_INVALID`, `TICKET_QR_EXPIRED`, `TICKET_ALREADY_CHECKED_IN`… |
| `config/SecurityConfig.java` | Gác xác thực (`authenticated()`); **gate vai trò ADMIN/STAFF cho check-in** nằm ở service. |

### Frontend web (`frontend/src/`)

| File | Trách nhiệm |
|---|---|
| `pages/admin/AdminEventOrganizePage.jsx` | Màn tổ chức + **check-in** event-scoped (nhập mã/dán token, server verify) + **thẻ xác minh người tham dự**. |
| `pages/admin/AdminEventManagePage.jsx`, `AdminEventsPage.jsx` | Danh sách/quản lý sự kiện admin. |
| `components/MyTicketCard.jsx` | Hiển thị vé của user + **render QR từ `qrToken`** (fallback legacy). |
| `components/event/JoinEventDialog.jsx`, `utils/eventRegistration.js` | Luồng đăng ký + trả lời câu hỏi. |
| `hooks/events/useCheckInTicket.js`, `useEventParticipants.js`, `useEventQuestions.js` | React Query hooks; `useCheckInTicket(eventId)` gọi endpoint event-scoped (`{qrToken}`/`{code}`). |
| `utils/api.js` | `eventApi.checkInTicket(eventId, {qrToken, code})`; **đã gỡ** approve/reject/bulk/activate/expire. |
| `pages/user/MyTicketsPage.jsx` | "Vé của tôi". |

### Mobile (`mobile_flutter/lib/features/event/`) — **phần check-in mới**

| File | Trách nhiệm |
|---|---|
| `presentation/pages/admin_check_in_events_page.dart` | **Màn chọn sự kiện** của tổ chức để check-in (gate `isStaffProvider`). |
| `presentation/pages/event_check_in_scanner_page.dart` | **Scanner QR**: camera + overlay, flash, đổi camera, nhập tay; nhận diện prefix (`TKT2-`→`qrToken`, legacy→`code`); bottom-sheet kết quả **+ avatar/tên/email** người tham dự. |
| `presentation/pages/ticket_detail_page.dart` | Vé của user; **render QR từ `qrToken`** (fallback legacy). |
| `data/repositories/event_repository.dart` | **`checkIn(eventId, {qrToken, code})`**, `getTicketByCode`, `getOrganizationEvents`. |
| `data/models/event_ticket.dart` | Model vé + `qrToken`, `attendeeName/Email/AvatarUrl`, `attendeeLabel`, `displayEmail`, `statusKey`. |
| `presentation/providers/event_provider.dart` | `adminCheckInEventsProvider` (list sự kiện theo orgId). |
| `core/constants/api_endpoints.dart` | `eventTicketByCode`, **`eventCheckIn(eventId)`** (event-scoped). |
| `core/router/{route_names,app_router}.dart` | Route `/admin/check-in` và `/admin/check-in/:eventId`. |
| `features/auth/presentation/providers/auth_provider.dart` | `isStaffProvider` (ADMIN/MODERATOR/STAFF từ JWT `role`). |
| `features/user/presentation/pages/settings_page.dart` | Tile "Quét vé check-in" (chỉ hiện cho staff). |
| `pubspec.yaml`, `android/.../AndroidManifest.xml`, `ios/Runner/Info.plist` | Thêm `mobile_scanner` + quyền camera. |

---
                              
## 6. Thay đổi đã thực hiện & ghi chú còn lại

### A. Bảo mật & tính đúng đắn — **đã xử lý**

1. **Check-in enforce phạm vi sự kiện ở backend.** ✅
   Thay endpoint toàn cục `POST /tickets/{code}/check-in` bằng **event-scoped**
   `POST /api/events/{eventId}/tickets/check-in`. Service so khớp
   `ticket.eventId == eventId` (và `eventId` trong token), lệch → `TICKET_WRONG_EVENT`.
   Việc "vé sai sự kiện" không còn chỉ kiểm ở client.

2. **Gate vai trò cho check-in.** ✅
   `EventService.checkIn` yêu cầu vai trò `ADMIN`/`STAFF`/`MODERATOR` (ném
   `FORBIDDEN`), không còn dựa vào UX. *(Còn lại: cân nhắc kiểm "actor thuộc đúng
   tổ chức của sự kiện" và gate role chung cho `/api/admin/**` — xem §C.)*

3. **QR đã mã hoá.** ✅
   `qrToken` = JWE **AES-256-GCM** bọc `{tc, ev, exp}`, prefix `ALUMVERSE-TKT2-`.
   Giấu `ticket_code`, chống giả mạo, ràng buộc `eventId` + thời hạn. Server cấp
   token; client chỉ render. (Xem §4.)

### B. Mâu thuẫn trạng thái — **đã dọn**

4. **Gỡ luồng duyệt "chết".** ✅
   Đã xoá `approve` / `reject` / `bulk-approve` / `approve-all` (controller +
   service + repo + R2DBC query + DTO `ApproveTicketRequest`/`BulkApproveRequest`
   + hàm frontend tương ứng). Tự đăng ký vẫn tạo thẳng `ISSUED`.
   *Nếu sau này cần duyệt: thêm cờ `requiresApproval` trên `events` và khôi phục
   luồng `PENDING` (lịch sử nằm trong git).*

5. **Bỏ `activate`/`expire`.** ✅
   Đã xoá `POST /tickets/activate` và `/tickets/expire` (không UI nào dùng).
   Check-in nhận `ISSUED` (vẫn dung nạp `ACTIVE` cho dữ liệu cũ). Trạng thái
   `ACTIVE`/`EXPIRED` không còn API sinh ra.

### C. Trải nghiệm & vận hành — **đã xử lý + còn lại**

6. **Đồng bộ prefix QR + hiển thị thông tin người tham dự.** ✅
   Web/mobile nhận diện prefix (`TKT2-`→`qrToken`, `TICKET-`/mã→`code`). Sau
   check-in, cả web (thẻ xác minh) và mobile (bottom-sheet) **hiện avatar + tên +
   email** để staff đối chiếu người thật. (Yêu cầu chính của đợt này.)

7. **Idempotency & double-scan.** ✅ (giữ nguyên)
   Mobile chặn double-scan bằng `_busy` + `DetectionSpeed.noDuplicates`; backend
   chặn theo trạng thái và báo rõ "đã check-in".

8. **Còn lại — thống kê check-in realtime trên mobile.** ⏳
   Sau mỗi lần quét chưa cập nhật bộ đếm "đã check-in / tổng". → dùng
   `getEventStatistics` để hiển thị counter + danh sách gần nhất.

9. **Còn lại — gộp logic list sự kiện** giữa `/api/events` và `/api/admin/events`
   (admin dùng `size`, user-facing dùng `limit`). Mobile picker đang dùng admin
   endpoint để lấy cả draft/past.

### Tham khảo cấu hình

- `event.qr.ttl-days` (mặc định `30`): thời hạn token QR. Khoá dẫn xuất từ
  `jwt.secret` — đổi secret sẽ vô hiệu QR cũ (user mở lại vé là có token mới).
```
