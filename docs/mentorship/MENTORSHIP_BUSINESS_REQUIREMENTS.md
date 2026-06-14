# Yêu cầu nghiệp vụ — Module Mentorship (AlumVerse)

> **Phiên bản tài liệu:** 1.0  
> **Phạm vi:** Mentorship trong organization hiện tại (khoa / đơn vị người dùng đang chọn)  
> **Tính chất:** Cộng đồng **phi lợi nhuận** — kết nối cựu sinh viên và sinh viên đã xác minh học vấn với mentor cùng khoa để trao đổi kinh nghiệm, định hướng nghề nghiệp và hỗ trợ học tập. Không phải dịch vụ thương mại, không thu phí qua nền tảng.

Tài liệu này là nguồn tham chiếu cho Product, QA và đội phát triển khi refactor module Mentorship. Các mục hướng tới người dùng nghiệp vụ dùng tiếng Việt thân thiện; mapping kỹ thuật nội bộ chỉ dùng trong mục **Quy tắc truy cập** và phần triển khai (P0/P1/P2).

---

## 1. Mục tiêu Mentorship

| Mục tiêu | Mô tả |
| --- | --- |
| Kết nối cộng đồng | Tạo cầu nối giữa mentee (sinh viên / cựu sinh viên trong khoa) và mentor (cựu sinh viên / alumni có kinh nghiệm) trong cùng organization. |
| Tin cậy | Chỉ thành viên đã xác minh học vấn tại khoa mới đặt lịch và đăng ký làm mentor; mentor công khai chỉ sau khi khoa duyệt hồ sơ. |
| Trải nghiệm đơn giản | Một hồ sơ Mentorship thống nhất; đặt lịch **xác nhận ngay** khi chọn slot trống (không chờ mentor duyệt yêu cầu). |
| Minh bạch vòng đời buổi hẹn | Trạng thái buổi mentoring rõ ràng: đã xác nhận → hoàn tất → đánh giá; hủy và báo cáo có quy tắc riêng. |
| Ngôn ngữ thân thiện | Giao diện tiếng Việt, không lộ thuật ngữ kỹ thuật (cấp xác thực, verify, permission tier) trên màn hình Mentorship. |

**Out of scope (tóm tắt):** Thu phí mentoring, marketplace mentor trả phí, cam kết SLA pháp lý giữa các bên. Các tính năng nâng cao (nhắc lịch email, đổi lịch đầy đủ, mentor đánh giá mentee) nằm ở P1/P2 — xem mục 12.

---

## 2. Actors (Vai trò)

| Actor | Mô tả | Hành vi chính |
| --- | --- | --- |
| **Khách (chưa đăng nhập)** | Người xem landing Mentorship | Xem giới thiệu, danh sách mentor (nếu public), không đặt lịch. |
| **Thành viên organization** | User thuộc khoa đang chọn | Trải qua xác thực email → xác minh học vấn → tham gia mentee và/hoặc đăng ký mentor. |
| **Mentee** | Thành viên đủ điều kiện đặt lịch | Tìm mentor, đặt lịch, tham gia buổi hẹn, đánh giá sau khi hoàn tất. |
| **Mentor (chờ duyệt)** | Đã gửi hồ sơ 3 bước, trạng thái chờ khoa | Không hiển thị công khai, không tạo lịch rảnh cho đến khi được duyệt. |
| **Mentor (đã duyệt)** | Hồ sơ được khoa phê duyệt | Tạo slot, quản lý buổi hẹn với vai trò mentor; vẫn có thể đặt lịch với mentor khác với vai trò mentee. |
| **Quản trị khoa / Admin** | Admin Mentorship trong organization | Duyệt / từ chối hồ sơ mentor; không duyệt từng yêu cầu đặt lịch (auto-confirm). |

**Lưu ý:** Một tài khoản có thể vừa là mentee vừa là mentor (sau khi mentor được duyệt). Mentor **không** được đặt lịch với chính mình.

---

## 3. Quy tắc truy cập theo xác thực trong organization hiện tại

Trạng thái truy cập được xác định theo **thành viên organization hiện tại** (org slug người dùng đang dùng), không theo tài khoản toàn cục.

### 3.1. Ngôn ngữ hiển thị (UI) — bắt buộc

Trên mọi màn Mentorship, **không** hiển thị: *cấp 0/1/2*, *verify*, *verification level*, *Guest*, *permission*, *tier*.

Thay vào đó dùng mô tả trạng thái thân thiện (xem mục 10 — bảng copy).

### 3.2. Mapping nội bộ (chỉ dev / QA / tài liệu kỹ thuật)

| `verificationLevel` (org member) | Trạng thái nghiệp vụ (UI) | Quyền Mentorship |
| --- | --- | --- |
| — (chưa đăng nhập) | Khách | Xem landing; CTA đăng nhập / tạo tài khoản. |
| 0 | Đã đăng ký, chưa xác thực email | Không đặt lịch; không gửi hồ sơ mentor; CTA xác thực email. |
| 1 | Đã xác thực email, chưa xác minh học vấn tại khoa | Có thể xem preview mentor; **không** đặt lịch; **không** đăng ký mentor; CTA xác minh học vấn. |
| ≥ 2 | Đã xác minh học vấn tại khoa | Đủ điều kiện mentee (đặt lịch, hoàn thiện hồ sơ); đủ điều kiện **gửi** hồ sơ mentor. |

**Backend (P0):** Mọi gate quan trọng (đặt lịch, đăng ký mentor, tạo slot) phải kiểm tra `verificationLevel ≥ 2` trên organization hiện tại, đồng bộ với frontend.

### 3.3. Ma trận CTA theo trạng thái người dùng

| Trạng thái | Thông điệp / hành động gợi ý trên hub Mentorship |
| --- | --- |
| Khách | *Đăng nhập để tham gia* / *Tạo tài khoản* |
| Chưa xác thực email | *Xác thực email* — giải thích cần xác thực để dùng tính năng cộng đồng |
| Chưa xác minh học vấn | *Xác minh học vấn* — giải thích cần xác minh tại khoa để đặt lịch |
| Đã xác minh, chưa có / chưa đủ hồ sơ mentee | *Hoàn thiện hồ sơ Mentorship* |
| Đã xác minh, sẵn sàng mentee | *Tìm mentor* / *Đặt lịch* |
| Đã gửi hồ sơ mentor (chờ khoa) | *Hồ sơ mentor đang chờ khoa duyệt* — xem hồ sơ đã gửi (không CTA *Duyệt yêu cầu* trên hub) |
| Mentor đã duyệt | *Quản lý lịch rảnh* / *Bảng điều khiển mentor* + vẫn có luồng mentee |

---

## 4. Unified profile logic (Hồ sơ Mentorship thống nhất)

### 4.1. Nguyên tắc

- **Một điểm vào** *Hồ sơ Mentorship* cho thành viên đã đăng nhập.
- **Phần Mentee:** form ngắn (mục tiêu, ngành, năm học, sở thích, …) — **không** cần admin duyệt; lưu / cập nhật tự do khi đủ quyền truy cập mentee.
- **Phần Mentor:** mở rộng sau khi user chọn *Đăng ký làm Mentor* (flow 3 bước). Trước duyệt: chỉ user và admin thấy trạng thái chờ. Sau duyệt: hiển thị tab/quản lý lịch rảnh, dashboard mentor.

### 4.2. Quy tắc hiển thị tab / điều hướng

| Thành phần | Điều kiện hiển thị |
| --- | --- |
| Chỉnh sửa phần mentee | Đã đăng nhập + `verificationLevel ≥ 2` (khuyến nghị; có thể cho phép xem form sớm hơn nhưng không book) |
| Form đăng ký mentor | `verificationLevel ≥ 2`, chưa có hồ sơ APPROVED đang active (hoặc theo quy tắc resubmit của admin) |
| Tab Lịch rảnh / Dashboard mentor | Mentor `status = APPROVED` |
| Hồ sơ công khai mentor | Chỉ mentor **APPROVED**; PENDING không lộ qua URL trực tiếp |

### 4.3. Đặt lịch vs hồ sơ mentee

- **Không bắt buộc** hoàn thiện hồ sơ mentee **trước** khi đặt lịch (P0): form đặt lịch thu thập thông tin tối thiểu cần cho buổi hẹn; sau đó khuyến khích lưu hồ sơ để lần sau không nhập lại.
- Upsert hồ sơ mentee vẫn qua API/profile riêng, không thay thế dữ liệu buổi hẹn đã tạo.

---

## 5. Mentor application approval (Duyệt hồ sơ mentor)

| Bước | Hành vi |
| --- | --- |
| Gửi hồ sơ | User hoàn thành 3 bước → trạng thái **PENDING** (chờ khoa duyệt). |
| Trong lúc PENDING | Không xuất hiện trong danh sách mentor công khai; không tạo / không hiển thị slot công khai; availability API bị chặn (P0). |
| Admin duyệt | **APPROVED** → hiển thị list, public profile, cho phép tạo slot. |
| Admin từ chối | **REJECTED** (hoặc trạng thái tương đương) — copy rõ ràng, hướng dẫn chỉnh sửa / gửi lại nếu product cho phép. |

**Khác với booking:** Admin **không** duyệt từng lần đặt lịch mentee — xem mục 6.

---

## 6. Booking auto-confirm (Đặt lịch xác nhận ngay)

### 6.1. Luồng nghiệp vụ

1. Mentee (đủ `verificationLevel ≥ 2`) chọn mentor **APPROVED** và slot **AVAILABLE**.
2. Điền form buổi hẹn (chủ đề, ghi chú, tùy chọn CV/link, …).
3. Hệ thống **ngay lập tức** tạo session **`CONFIRMED`** và chuyển slot sang **`BOOKED`** (giao dịch atomic — P0).
4. Thông báo thành công UI: *Đặt lịch thành công. Buổi mentoring của bạn đã được xác nhận* — **không** dùng *Đã gửi yêu cầu* / *Chờ mentor xác nhận*.

### 6.2. Quy tắc validation

| Quy tắc | Mô tả |
| --- | --- |
| Mentor phải APPROVED | Từ chối book mentor PENDING / ẩn. |
| Slot phải AVAILABLE | Slot đã BOOKED không hiển thị cho người khác. |
| Không self-book | User không đặt lịch với chính mình (cùng member / cùng mentor profile). |
| Mentor book mentor khác | Được — với vai trò mentee, cùng gate verification. |
| Trùng lịch mentee | P1: chặn overlap nhiều session CONFIRMED cùng khung giờ. |

### 6.3. Loại bỏ luồng cũ

- Trạng thái booking **PENDING** chờ mentor approve → **bỏ** (dữ liệu cũ migrate sang CONFIRMED hoặc hủy — xem rủi ro triển khai).
- UI *Chấp nhận / Từ chối yêu cầu đặt lịch* trên dashboard mentor → **bỏ** (P0 frontend).

---

## 7. Session lifecycle (Vòng đời buổi hẹn)

### 7.1. Trạng thái chuẩn (lưu UPPERCASE ở backend)

| Status | Ý nghĩa nghiệp vụ | Label UI (gợi ý) |
| --- | --- | --- |
| `CONFIRMED` | Buổi hẹn đã xác nhận, chưa diễn ra / chưa kết thúc | Đã xác nhận |
| `CANCELLED_BY_MENTEE` | Mentee hủy | Đã hủy (bởi mentee) — có thể rút gọn *Đã hủy* + chi tiết trong lịch sử |
| `CANCELLED_BY_MENTOR` | Mentor hủy | Đã hủy (bởi mentor) |
| `COMPLETED` | Buổi đã diễn ra, mentor (hoặc quy trình) đánh dấu hoàn tất | Đã hoàn tất |
| `REPORTED` | Có báo cáo sự cố gắn session (P1) | Đang xử lý / Đã báo cáo (tùy policy hiển thị) |

**Legacy:** `CANCELLED` có thể map sang cancelled_by tương ứng khi migrate. **PENDING / REJECTED** booking → không tạo mới.

### 7.2. Chuyển trạng thái (tóm tắt)

```text
[Slot AVAILABLE] --book--> CONFIRMED (slot BOOKED)
CONFIRMED --mentee cancel--> CANCELLED_BY_MENTEE
CONFIRMED --mentor cancel--> CANCELLED_BY_MENTOR
CONFIRMED --mark completed--> COMPLETED
COMPLETED --mentee feedback--> (giữ COMPLETED, thêm feedback record)
CONFIRMED/COMPLETED --report (P1)--> REPORTED (policy cụ thể khi triển khai)
```

### 7.3. Hoàn tất buổi hẹn (P0)

- Mentor (hoặc endpoint được phép) **đánh dấu đã hoàn tất** → `COMPLETED`.
- Mentee nhận prompt **đánh giá buổi mentoring** (rating + nhận xét) sau `COMPLETED`.

### 7.4. Hủy buổi hẹn

- **P0:** Hủy cơ bản, phân biệt ai hủy (field `cancelled_by` nội bộ).
- **P1:** Bắt buộc / khuyến khích **lý do hủy** (`cancel_reason`); thông báo cho bên còn lại.
- **Slot sau hủy (MVP):** Theo Option A / policy P1 — có thể **không** trả slot về AVAILABLE ngay để tránh abuse; tài liệu triển khai chốt trong P1. (Plan ghi MVP cancel không mở slot — ghi rõ trong known limitations PR.)

### 7.5. Đổi lịch — Option A (MVP, P1)

- Nút *Đề xuất đổi lịch* / *Đổi lịch*: **hủy** session hiện tại (theo quy tắc hủy) + hướng dẫn mentee **đặt slot mới** (không có trạng thái `RESCHEDULE_REQUESTED` trong MVP).
- **P2:** Luồng đổi lịch có yêu cầu / chấp nhận đầy đủ.

### 7.6. Tab *Lịch hẹn* / My bookings (hướng P0/P1)

- **Sắp tới:** `CONFIRMED` (bỏ tab *Chờ duyệt*).
- **Đã hoàn tất:** `COMPLETED`.
- **Đã hủy:** các trạng thái `CANCELLED_*`.
- **P1:** Gom filter *Tôi là mentor / Tôi là mentee / Tất cả* trên một tab Lịch hẹn.

---

## 8. Feedback và báo cáo (Feedback / report rules)

### 8.1. Feedback (đánh giá sau buổi)

| Quy tắc | Chi tiết |
| --- | --- |
| Ai đánh giá | Mentee đánh giá mentor sau session `COMPLETED`. |
| Nội dung | Rating (sao) + nhận xét văn bản (giới hạn ký tự theo UI). |
| Một session | Một feedback mentee → mentor mỗi session (idempotent / chặn gửi trùng). |
| Rating mentor | Cập nhật `rating_avg` / số buổi trên hồ sơ mentor khi có feedback (P0/P1). |
| Mentor đánh giá mentee | **P2** — ngoài scope P0/P1 trừ khi bổ sung sau. |

### 8.2. Báo cáo sự cố (P1)

| Quy tắc | Chi tiết |
| --- | --- |
| Ai báo cáo | Mentee hoặc mentor trong session liên quan. |
| Khi nào | Thường từ session `CONFIRMED` hoặc sau `COMPLETED` (product chốt màn hình). |
| Dữ liệu | `session_id`, người báo cáo, người bị báo cáo, `reason_category`, mô tả. |
| Trạng thái session | Có thể chuyển / gắn `REPORTED`; moderation **P2**. |
| UI | Nút *Báo cáo sự cố* — copy không đổi oan mentor; admin xử lý ngoài luồng tự động MVP. |

---

## 9. Notification rules (Quy tắc thông báo)

**P0:** Có thể chưa gửi in-app — ưu tiên copy UI đúng. **P1:** Bật notification async qua `NotificationService` hiện có.

| Sự kiện | Người nhận | Nội dung (tiếng Việt, gợi ý) |
| --- | --- | --- |
| Đặt lịch thành công | Mentor | *{Mentee} đã đặt lịch mentoring với bạn vào {thời gian}.* |
| Đặt lịch thành công | Mentee | *Bạn đã xác nhận buổi mentoring với {Mentor} vào {thời gian}.* |
| Mentee hủy | Mentor | *Buổi mentoring {thời gian} đã được hủy bởi mentee.* (+ lý do P1) |
| Mentor hủy | Mentee | *Buổi mentoring {thời gian} đã được hủy bởi mentor.* (+ lý do P1) |
| Đánh dấu hoàn tất | Mentee | *Buổi mentoring đã hoàn tất. Hãy dành vài phút đánh giá.* |
| Nhắc đánh giá | Mentee | P1/P2 — sau X ngày nếu chưa feedback |
| Nhắc lịch | Cả hai | **P2** — 1 ngày / 1 giờ trước buổi (+ email P2) |

Thông báo lưu trong bảng `notifications` hiện có; không bắt buộc email trong P0/P1 trừ khi bật P2.

---

## 10. UI wording principles (Nguyên tắc copy)

### 10.1. Nguyên tắc

1. **Tiếng Việt**, câu ngắn, hướng hành động (CTA rõ).
2. **Không** lộ mã trạng thái kỹ thuật (`CONFIRMED`, `PENDING`, …) trên UI — chỉ label đã map.
3. **Không** dùng *Mentee Profile* / *Guest* — dùng *Hồ sơ Mentorship*, *Khách* chỉ trong tài liệu nội bộ nếu cần.
4. Mentorship là **cộng đồng hỗ trợ**, tránh ngôn ngữ thương mại (*mua*, *thanh toán*, *duyệt đơn hàng*).
5. Thông báo lỗi gate: giải thích **việc cần làm tiếp** (xác thực email, xác minh học vấn), không đổ lỗi hệ thống.

### 10.2. Bảng copy chuẩn

| Vị trí / tình huống | Không dùng | Dùng |
| --- | --- | --- |
| Landing — khách | Đăng nhập để bắt đầu | **Đăng nhập để tham gia** |
| Chưa xác thực email | cấp 0, Guest | **Vui lòng xác thực email để tiếp tục sử dụng các tính năng cộng đồng** |
| Chưa xác minh học vấn | cấp 1 | **Bạn cần xác minh thông tin học vấn tại khoa để đặt lịch mentoring** |
| Trang hồ sơ mentee | Đăng ký Mentee | **Hoàn thiện hồ sơ Mentorship** |
| Hub CTA | Trở thành Mentee / Cập nhật Mentee Profile | **Hoàn thiện hồ sơ Mentorship** |
| Mentor chờ duyệt | Duyệt yêu cầu | **Hồ sơ mentor đang chờ khoa duyệt** — *Xem hồ sơ đã gửi* |
| Sau khi book | Đã gửi yêu cầu đặt lịch | **Đặt lịch thành công. Buổi mentoring của bạn đã được xác nhận** |
| Session status | Chờ duyệt / Đã duyệt (booking) | **Đã xác nhận** / **Đã hoàn tất** / **Đã hủy** |
| Header chip (global) | Guest / Student / Alumni + tier | **Ẩn tier** hoặc: *Chưa xác thực* / *Đã xác thực email* / *Đã xác minh học vấn* |
| Public mentor không slot | (trống im lặng) | **Mentor hiện chưa có lịch rảnh** |
| Nút nhắn tin | (thiếu) | **Nhắn tin** (khi tích hợp chat — P1/P2) |

---

## 11. UAT checklist (Kiểm thử chấp nhận)

Dùng checklist này khi triển khai P0 trở đi; mục P1/P2 đánh dấu khi feature tương ứng release.

### 11.1. Truy cập

- [ ] Khách: xem landing Mentorship, không đặt lịch; CTA đăng nhập / đăng ký đúng copy.
- [ ] Chưa xác thực email: CTA xác thực email; không đặt lịch; không gửi hồ sơ mentor.
- [ ] Đã xác thực email, chưa xác minh học vấn: xem danh sách mentor (preview); đặt lịch bị chặn + message xác minh học vấn.
- [ ] Đã xác minh học vấn: đủ quyền mentee; form đăng ký mentor mở.

### 11.2. Hồ sơ

- [ ] Hoàn thiện hồ sơ mentee không cần admin duyệt.
- [ ] Gửi hồ sơ mentor → trạng thái chờ khoa; không hiện public list.
- [ ] Admin duyệt mentor → hiện list + public profile + tạo slot được.

### 11.3. Đặt lịch (auto-confirm)

- [ ] Chọn slot trống → session **CONFIRMED** ngay; slot **BOOKED**.
- [ ] Không đặt lịch với chính mình.
- [ ] Mentor đã duyệt đặt lịch với mentor khác được.
- [ ] Slot đã book không còn trong danh sách trống.
- [ ] Không còn UI *Chờ mentor xác nhận* / duyệt booking trên dashboard mentor.

### 11.4. Vòng đời buổi hẹn

- [ ] Tab Sắp tới / Hoàn tất / Đã hủy map đúng status.
- [ ] Mentor đánh dấu hoàn tất → mentee gửi đánh giá được.
- [ ] **(P1)** Hủy có lý do + thông báo in-app.
- [ ] **(P1)** Báo cáo sự cố lưu record + trạng thái REPORTED (nếu bật).
- [ ] **(P1)** Đổi lịch Option A: hủy + đặt lại slot mới.

### 11.5. Giao diện & copy

- [ ] Không còn *cấp N*, *verify*, *permission*, *Guest* trên màn Mentorship.
- [ ] CTA hub đúng từng trạng thái user (ma trận mục 3.3).
- [ ] Label trạng thái buổi hẹn khớp bảng mục 10.2.

### 11.6. Hồi quy

- [ ] Admin duyệt mentor vẫn hoạt động.
- [ ] Lọc / tìm kiếm mentor (khoa, chuyên môn, lịch rảnh).
- [ ] Tài khoản test theo `docs/test-accounts.sql` (khi có).

---

## 12. Tham chiếu phạm vi triển khai (P0 / P1 / P2)

| Ưu tiên | Nội dung chính (rút gọn) |
| --- | --- |
| **P0** | Gate BE/FE theo org verification; booking auto-confirm; bỏ duyệt booking; unified profile + CTA matrix; filter mentor APPROVED; self-book block; mark completed + feedback UI; tài liệu BR (tài liệu này). |
| **P1** | Cancel + lý do + notify; `mentorship_reports`; CV upload; tab Lịch hẹn gom vai trò; overlap booking; Option A đổi lịch; cập nhật rating_avg. |
| **P2** | Reschedule đầy đủ; reminder + email; mentor review mentee; moderation report; analytics / recurring slot. |

---

## 13. Tài liệu liên quan

- Kế hoạch refactor: `.cursor/plans/mentorship_br_refactor_7e5211f1.plan.md` (nội bộ dự án).
- Schema tham chiếu: `docs/postgre.sql` (cập nhật khi migration P0/P1).
- Tài khoản UAT: `docs/test-accounts.sql` (nếu có trong repo).

---

*Tài liệu FEATURE 1 — chỉ mô tả nghiệp vụ; không thay đổi mã nguồn.*
