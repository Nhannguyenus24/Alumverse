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
   (PENDING) ──approve──► ISSUED ──activate──► ACTIVE ──check-in──► CHECKED_IN / USED
       │                    │                    │
     reject               cancel               cancel
       ▼                    ▼                    ▼
   REJECTED             CANCELLED            CANCELLED
                                   │
                              (sau sự kiện) ──expire──► EXPIRED
```

- **Tự đăng ký** (`registerForEvent`) tạo vé **thẳng ở `ISSUED`** (không qua
  `PENDING`) → nghiệp vụ hiện tại **không bắt duyệt**. Bước approve/reject chỉ
  áp dụng cho vé `PENDING` (xem [§6 Tối ưu](#6-đánh-giá--đề-xuất-tối-ưu)).
- Check-in chấp nhận vé ở `ISSUED` **hoặc** `ACTIVE`.
- Vé `CANCELLED`/`EXPIRED` không check-in được; `CHECKED_IN`/`USED` báo "đã check-in".

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

## 4. Cơ chế QR & Check-in

### Sinh QR (phía người dùng)
- QR **render hoàn toàn trên client** (web: `qrcode.react`; mobile: `qr_flutter`),
  không qua dịch vụ bên thứ 3.
- Nội dung QR: **`ALUMVERSE-TICKET-{ticketCode}`**.
- QR chỉ là cách hiển thị `ticket_code` — **không** ký số, không mã hóa, không
  hạn riêng. Bảo mật dựa vào tính khó-đoán của `ticket_code`.

### Check-in (phía ADMIN/STAFF)
- **Web**: nhập/dán `ticket_code` vào ô text (không có scanner camera). Client tự
  validate `ticket.eventId === eventId`, rồi gọi check-in.
- **Mobile (mới)**: **quét camera** → bóc prefix `ALUMVERSE-TICKET-` → validate
  đúng `eventId` → gọi check-in. Có nhập tay dự phòng cho QR hỏng.
- Backend `POST /api/events/tickets/{ticketCode}/check-in`:
  - `CANCELLED`/`EXPIRED` → lỗi; `CHECKED_IN`/`USED` → "đã check-in";
  - chỉ cho check-in khi `ISSUED`/`ACTIVE` → set `CHECKED_IN` + `checked_in_at`.

---

## 5. File nào chịu trách nhiệm phần nào

### Backend (`backend/src/main/java/com/service/backend/event/`)

| File | Trách nhiệm |
|---|---|
| `controller/EventController.java` | REST endpoints user-facing: CRUD, publish, interest, invite, register, approve/reject, reminder, activate, **check-in**, expire, cancel, questions. |
| `service/EventService.java` | Toàn bộ nghiệp vụ: validate câu trả lời, sức chứa, vòng đời vé, gửi email/notification, thống kê. |
| `dao/EventRepository.java` (impl `IEventRepository`) | Truy cập DB: sinh `ticket_code`, set trạng thái, query vé/sự kiện/lời mời. |
| `dao/Event*R2dbcRepository.java` | Spring Data R2DBC interfaces (event/ticket/interest/invitation/question/email-log). |
| `dto/*` | Request/response DTO (CreateEvent, RegisterTicket, BulkApprove, ReminderEmail, EventQuestion…). |
| `shared/entity/EventTicket.java`, `Event.java`, … | Entity map bảng; `EventTicket` serialize/deserialize `registration_answers`. |
| `admin/controller/AdminEventController.java` | Quản trị sự kiện theo tổ chức: list/search/by-status, tickets, statistics (dùng cho **picker** trên mobile). |
| `shared/enums/ErrorCode.java` | Mã lỗi nghiệp vụ: `EVENT_FULLY_BOOKED`, `TICKET_ALREADY_CHECKED_IN`, `TICKET_WRONG_EVENT`… |
| `config/SecurityConfig.java` | Gác xác thực; **chỉ yêu cầu `authenticated()`** cho endpoint non-public (không gate role theo path). |

### Frontend web (`frontend/src/`)

| File | Trách nhiệm |
|---|---|
| `pages/admin/AdminEventOrganizePage.jsx` | Màn tổ chức + **check-in** theo sự kiện (nhập mã, validate eventId, gọi API). |
| `pages/admin/AdminEventManagePage.jsx`, `AdminEventsPage.jsx` | Danh sách/quản lý sự kiện admin. |
| `components/MyTicketCard.jsx` | Hiển thị vé của user + **render QR** (`ALUMVERSE-TICKET-{code}`). |
| `components/event/JoinEventDialog.jsx`, `utils/eventRegistration.js` | Luồng đăng ký + trả lời câu hỏi. |
| `hooks/events/useCheckInTicket.js`, `useEventParticipants.js`, `useEventQuestions.js` | React Query hooks cho check-in/participants/questions. |
| `pages/user/MyTicketsPage.jsx` | "Vé của tôi". |

### Mobile (`mobile_flutter/lib/features/event/`) — **phần check-in mới**

| File | Trách nhiệm |
|---|---|
| `presentation/pages/admin_check_in_events_page.dart` | **Màn chọn sự kiện** của tổ chức để check-in (gate `isStaffProvider`). |
| `presentation/pages/event_check_in_scanner_page.dart` | **Scanner QR**: camera + overlay, flash, đổi camera, nhập tay, bottom-sheet kết quả; bóc prefix + validate eventId + gọi check-in. |
| `data/repositories/event_repository.dart` | `getTicketByCode`, **`checkInTicket`**, **`getOrganizationEvents`** (dùng `/api/admin/events`). |
| `data/models/event_ticket.dart` | Model vé + `attendeeLabel`, `statusKey`, `isCheckedIn/isCancelled`. |
| `presentation/providers/event_provider.dart` | `adminCheckInEventsProvider` (list sự kiện theo orgId). |
| `core/constants/api_endpoints.dart` | `eventTicketByCode`, `eventCheckIn`. |
| `core/router/{route_names,app_router}.dart` | Route `/admin/check-in` và `/admin/check-in/:eventId`. |
| `features/auth/presentation/providers/auth_provider.dart` | `isStaffProvider` (ADMIN/MODERATOR/STAFF từ JWT `role`). |
| `features/user/presentation/pages/settings_page.dart` | Tile "Quét vé check-in" (chỉ hiện cho staff). |
| `pubspec.yaml`, `android/.../AndroidManifest.xml`, `ios/Runner/Info.plist` | Thêm `mobile_scanner` + quyền camera. |

---

## 6. Đánh giá & đề xuất tối ưu

### A. Bảo mật & tính đúng đắn (ưu tiên cao)

1. **Check-in không enforce phạm vi sự kiện ở backend.**
   `checkInTicket(ticketCode)` chỉ tra theo mã toàn cục; việc "vé sai sự kiện"
   **chỉ kiểm ở client**. Đáng chú ý: backend **đã định nghĩa sẵn**
   `ErrorCode.TICKET_WRONG_EVENT` nhưng chưa dùng.
   → **Đề xuất**: thêm endpoint `POST /api/events/{eventId}/tickets/{code}/check-in`
   (hoặc thêm body `eventId`) và so khớp `ticket.eventId == eventId` ở service,
   ném `TICKET_WRONG_EVENT` khi lệch.

2. **Không gate role ở backend cho check-in & `/api/admin/**`.**
   `SecurityConfig` chỉ `authenticated()` → bất kỳ user đăng nhập nào cũng gọi
   được. Gate role hiện chỉ là UX (web + `isStaffProvider` mobile).
   → **Đề xuất**: thêm method security (`@PreAuthorize`) hoặc path rule cho
   ADMIN/STAFF; lý tưởng là kiểm tra "actor thuộc đúng tổ chức của sự kiện".

3. **QR không chống giả mạo.** `ticket_code` 8 ký tự, không ký số.
   → **Đề xuất (tùy mức độ)**: ký HMAC/JWT ngắn hạn cho payload QR, hoặc thêm
   nonce/expiry; tối thiểu rate-limit endpoint tra cứu vé để hạn chế brute-force.

### B. Mâu thuẫn trạng thái (nghiệp vụ)

4. **Luồng duyệt (PENDING) thực tế "chết".**
   Tự đăng ký set thẳng `ISSUED`, nên `approve/reject/bulk-approve` (chỉ xử lý
   `PENDING`) gần như không có vé để xử lý.
   → **Đề xuất**: chọn 1 trong 2 — (a) nếu sự kiện cần duyệt thì cho `register`
   tạo `PENDING` (cấu hình `requiresApproval` trên `events`); (b) nếu không cần
   thì gỡ/đánh dấu deprecated các API duyệt để tránh hiểu nhầm.

5. **`ACTIVE` vs `ISSUED` cho check-in.** Cho phép cả hai khiến bước `activate`
   gần như không bắt buộc. → **Đề xuất**: làm rõ ý nghĩa `activate` (mở cổng
   check-in theo thời gian) hoặc bỏ nếu thừa.

### C. Trải nghiệm & vận hành

6. **Prefix QR không được bóc ở web.** Web mong `ABC12345` nhưng QR chứa
   `ALUMVERSE-TICKET-ABC12345`. Mobile đã bóc prefix; **web nên đồng bộ**
   (`code.replace(/^ALUMVERSE-TICKET-/, '')`).

7. **Thiếu thống kê check-in realtime trên mobile.** Sau mỗi lần quét chưa cập
   nhật bộ đếm "đã check-in / tổng". → **Đề xuất**: hiển thị counter + danh sách
   gần nhất, dùng `getEventStatistics`.

8. **Idempotency & double-scan.** Mobile đã chặn double-scan bằng cờ `_busy` +
   `DetectionSpeed.noDuplicates`; backend cũng chặn theo trạng thái. Tốt — nên
   giữ và bổ sung thông báo rõ khi quét trùng (đang có).

### D. Kỹ thuật

9. **`bulkApproveTickets` nuốt lỗi từng vé** (`onErrorReturn(0)`) — khó debug.
   → **Đề xuất**: trả về danh sách id thất bại + lý do.

10. **Trùng lặp logic list sự kiện** giữa `/api/events` và `/api/admin/events`.
    Mobile picker dùng admin endpoint (lấy cả draft/past). → cân nhắc hợp nhất
    tham số (lưu ý: admin dùng `size`, user-facing dùng `limit`).
```
