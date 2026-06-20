# Plan: Tính năng Gây quỹ / Đóng góp (Fundraising) trên Mobile (Flutter)

> Mục tiêu: port tính năng **Gây quỹ ("Đóng góp & Quỹ")** từ `frontend/` (React) sang
> `mobile_flutter/` (Flutter + Riverpod + Dio + go_router), đạt ngang phần dành cho
> **người dùng thường (USER)**.
>
> **PHẠM VI: KHÔNG làm phần ADMIN.** Mobile chỉ làm chức năng người dùng cuối:
> xem danh sách quỹ, xem chi tiết quỹ, quyên góp (nhận QR thanh toán), xem lịch sử
> đóng góp của bản thân, xem danh sách người đã đóng góp cho một quỹ.
> Bỏ qua hoàn toàn: tạo/sửa/đóng quỹ, quản lý tài khoản ngân hàng nhận tiền,
> tạo trạng thái quỹ, dashboard thống kê admin.
>
> Tham chiếu mobile (mẫu kiến trúc đã đọc): feature **Event** —
> `features/event/{data/models/event_summary.dart, data/repositories/event_repository.dart,
> presentation/{pages,providers}}`. Fundraising mô phỏng đúng pattern này (list → detail → action).
>
> Tham chiếu web (code thực tế đã đọc):
> `pages/donation/{DonationPage.jsx, DonationArticlePage.jsx, DonationDetailPage.jsx}`,
> `components/donation/*`, `components/articles/{ArticleDonationCard,FeaturedArticleDonationCard}.jsx`,
> `hooks/fundraising/useUserDonations.js`, `hooks/news/{useFundStatuses,useFundReceivingInfos}.js`,
> `utils/api.js` (`fundApi`).
>
> Tham chiếu backend (đã đọc): `fundraising/controller/{FundController,FundDonationsController,
> FundReceivingInfosController,FundStatusController}.java`, `fundraising/service/FundService.java`,
> `shared/entity/{Funds,FundDonations,FundReceivingInfos,FundStatus}.java`.

---

## 1. Hiện trạng — Gap Analysis

### Web frontend (USER) có gì

| # | Sub-feature | Vị trí web | API chính |
|---|---|---|---|
| 1 | **Danh sách quỹ** + tìm kiếm / lọc (trạng thái, khoảng ngày, khoảng số tiền, sort theo số người ủng hộ), card nổi bật ở đầu | `DonationPage.jsx`, `ArticleDonationCard.jsx`, `FeaturedArticleDonationCard.jsx` | `GET /api/funds` |
| 2 | **Chi tiết quỹ**: mô tả HTML, panel tiến độ (đã quyên / mục tiêu, % progress, số người ủng hộ, người quản lý, thời gian), nút "Đóng góp" (ẩn nếu quỹ đã đóng / hết hạn) | `DonationArticlePage.jsx`, `DonationFundInfoPanel.jsx` | `GET /api/funds/{id}` |
| 3 | **Form quyên góp**: chọn mức (100k/200k/500k/1tr/tùy chọn), ẩn danh hoặc nhập tên + email/SĐT/địa chỉ/lời nhắn; submit → nhận `checkoutUrl` (ảnh QR SePay) → hiển thị QR trong dialog | `DonationDetailPage.jsx` | `POST /api/fund-donations` |
| 4 | **Lịch sử đóng góp của tôi** (phân trang) | `useUserDonations.js` | `GET /api/fund-donations/user/{userId}` |

> **Chỉ ADMIN (KHÔNG port):** tạo quỹ (`POST /funds`), sửa quỹ (`PUT /funds/{id}`),
> đóng quỹ (`PUT /funds/{id}/close`), quản lý tài khoản nhận tiền
> (`POST /funds/receiving-infos`), tạo trạng thái (`POST /fund-statuses`),
> dashboard thống kê (`GET /admin/fundraising/statistics`),
> **danh sách người đóng góp của 1 quỹ** (`GET /api/fund-donations/{fundId}` —
> dùng ở màn quản lý của admin, `DonationListSection.jsx`).

### Mobile hiện có gì

| Hạng mục | Trạng thái |
|---|---|
| `features/fundraising/` | ❌ **Chưa tồn tại** thư mục feature. |
| `core/router/route_names.dart` | ✅ Đã có `RouteNames.fundraising = '/fundraising'` (dòng 25). |
| `core/router/app_router.dart` | ⚠️ Route `/fundraising` đang trỏ tới **`FeaturePlaceholderPage`** ("Đóng góp & Quỹ") — cần thay bằng trang thật + thêm route con `/fundraising/:id`, `/fundraising/:id/donate`. (dòng 297-303) |
| `core/constants/api_endpoints.dart` | ⚠️ **Đã có** (dòng 124-132): `funds`, `fundDetail(id)`, `fundClose(id)`, `fundStatuses`, `fundStatistics`, `fundReceivingActive`, `fundDonations`, `fundDonationsByFund(fundId)`. **Thiếu:** `fundDonationsByUser(userId)`, `fundBanks` (xem Mục 4). `fundClose` không dùng (admin). |
| `shared/widgets/main_scaffold.dart` | Nav bar hiện 5 tab: Home / Forum / Mentorship / Events / Profile. Fundraising **chưa** có entry point trong app — cần quyết định cách vào (xem Mục 7). |
| `pubspec.yaml` | `cached_network_image`, `flutter_widget_from_html_core` (render HTML mô tả) đã có sẵn (event dùng). `url_launncher` cần kiểm tra cho nút "Mở liên kết thanh toán". `qr_flutter` **không cần** (backend trả ảnh QR sẵn, chỉ cần `CachedNetworkImage`). |

### Kết luận: **CHƯA bắt đầu.** Mức độ ~3% (chỉ có route name + hằng số endpoint + placeholder).
Backend **đã hỗ trợ đầy đủ** mọi endpoint USER (tất cả là `@PublicEndpoint`). Đây thuần là
công việc **client-side trên mobile**, không cần đổi backend.

---

## 2. Mô hình dữ liệu (Models)

Theo pattern Event: **fromJson thủ công**, không dùng `json_serializable`. Số nguyên parse
qua `(json['x'] as num?)?.toInt() ?? 0`; ngày qua helper `DateTime.tryParse`; tiền dùng `double`
(BigDecimal backend) — format VND ở UI.

### 2.1 `features/fundraising/data/models/fund_summary.dart`
Cho card danh sách. Map theo `FundListItemResponse`:
```
id (int), organizationId (int?), statusId (int?), donorCount (int),
managerName (String?), name (String), logoUrl (String?), descriptionShort (String?),
targetAmount (double), currentAmount (double),
timeStarted (DateTime?), timeEnded (DateTime?), topic (String?)
```
Helper tiện ích trên model: `double get progress => targetAmount <= 0 ? 0 : (currentAmount/targetAmount).clamp(0,1)`;
`bool get isClosed` = `timeEnded != null && timeEnded.isBefore(now)` (hoặc theo statusName ở detail).

### 2.2 `features/fundraising/data/models/fund_detail.dart`
Map theo `FundDetailResponse` (thêm so với summary):
```
organizationName (String?), statusName (String?), descriptionFull (String? – HTML),
fundReceivingInfo: { id, accountNumber, accountName, bankName, isActive }  // nested object
```
→ tách `fund_receiving_info.dart` (model con) hoặc inline.

### 2.3 `features/fundraising/data/models/fund_donation.dart`
Map theo `FundDonationListItemResponse` (dùng cho "lịch sử đóng góp của tôi"):
```
id (int), fundId (int?), donorMemberId (int?), donorName (String?),
amount (double), address/phone/email/message (String?),
status (String? – PENDING/SUCCESS/FAILED), createdAt (DateTime?), avatarUrl (String?)
```

### 2.4 (tùy chọn) `fund_status.dart`
Map `{ id, name }` từ `GET /api/fund-statuses` — dùng cho dropdown lọc trạng thái. Có thể
bỏ qua ở v1 nếu lọc đơn giản.

### Phân trang
Tái dùng `shared/models/PaginatedResponse` (như network/event). Backend trả
`{ data: { items: [...], totalItem, totalPage } }` → unwrap qua helper `_pageResult` giống
`network_repository.dart`.

---

## 3. Repository — `features/fundraising/data/repositories/fundraising_repository.dart`

Pattern y hệt `event_repository.dart`: `Provider<FundraisingRepository>` nhận `ref.watch(dioProvider)`.
Tất cả endpoint là public nhưng vẫn đính kèm Bearer token nếu user đăng nhập (AuthInterceptor tự thêm) —
cần token để `donor_member_id` & lịch sử đóng góp hoạt động.

| Method | Endpoint | Ghi chú |
|---|---|---|
| `getFunds({page, limit, q, statusId, sortBy, direction, timeStartedFrom/To, targetAmountMin/Max})` | `GET /api/funds` | Trả `PageResult<FundSummary>`. organizationId tự gắn theo org hiện tại nếu backend yêu cầu (kiểm tra: web truyền `organizationId`). |
| `getFundDetail(int id)` | `GET /api/funds/{id}` | Trả `FundDetail`. Unwrap `data`. |
| `createDonation(CreateDonationRequest)` | `POST /api/fund-donations` | Trả `checkoutUrl` (String). |
| `getMyDonations({userId, page, limit})` | `GET /api/fund-donations/user/{userId}` | Lịch sử của tôi. userId lấy từ JWT (xem `core/utils/jwt`/`authState`). |
| `getFundStatuses()` *(tùy chọn)* | `GET /api/fund-statuses` | Cho bộ lọc. |

> **KHÔNG** thêm `getFundDonors` / `GET /api/fund-donations/{fundId}` — đây là màn quản lý admin.

**Request body POST /fund-donations** (DTO `CreateFundDonationRequest`, lưu ý snake_case):
```json
{
  "fundId": 1,
  "donor_member_id": 123,      // null nếu ẩn danh / chưa đăng nhập
  "donor_name": "Nguyễn Văn A", // null nếu ẩn danh → backend đặt "Ẩn danh"
  "amount": 100000,            // > 0, số nguyên VND
  "address": null, "phone": null, "email": null, "message": null
}
```
Response: `{ "checkoutUrl": "https://qr.sepay.vn/img?..." }` — là **ảnh QR**, hiển thị trực tiếp.

---

## 4. Bổ sung `api_endpoints.dart`

Thêm vào block `// --- Funds ---`:
```dart
static String fundDonationsByUser(int userId) => '/api/fund-donations/user/$userId';
static const String fundBanks = '/api/funds/banks'; // chỉ cần nếu hiển thị tên ngân hàng
```
(`fundClose` giữ nguyên nhưng KHÔNG dùng — là endpoint admin.)

---

## 5. State management (Riverpod) — `presentation/providers/fundraising_provider.dart`

Theo pattern event/network:

```dart
// Bộ lọc/tìm kiếm danh sách (mutable)
class FundQuery { final String q; final int? statusId; final String? sortBy;
  final String direction; final int page; ... copyWith ... }
final fundQueryProvider = StateProvider<FundQuery>((ref) => const FundQuery());

// Danh sách quỹ (reactive theo query)
final fundsProvider = FutureProvider<PageResult<FundSummary>>((ref) {
  final q = ref.watch(fundQueryProvider);
  return ref.watch(fundraisingRepositoryProvider).getFunds(...q);
});

// Chi tiết quỹ
final fundDetailProvider = FutureProvider.family<FundDetail, int>((ref, id) =>
  ref.read(fundraisingRepositoryProvider).getFundDetail(id));

// Lịch sử đóng góp của tôi
final myDonationsProvider = FutureProvider<PageResult<FundDonation>>((ref) {
  final userId = ref.watch(authStateProvider).userId; // lấy từ auth
  return ref.read(fundraisingRepositoryProvider).getMyDonations(userId: userId, page: 0, limit: 20);
});
```
Submit quyên góp dùng `ConsumerStatefulWidget` giữ loading cục bộ (giống nút interest/register
của event detail), không cần StateNotifier riêng. Sau khi tạo thành công → `ref.invalidate(fundDetailProvider(id))`
và `myDonationsProvider`.

---

## 6. UI / Pages

Thư mục: `features/fundraising/presentation/pages/` và `.../widgets/`.

### 6.1 `fundraising_list_page.dart` (FundsPage)
- `ConsumerWidget`, `ref.watch(fundsProvider).when(loading/error/data)` — dùng `SkeletonList`, `ErrorView` sẵn có.
- Thanh tìm kiếm (debounce → cập nhật `fundQueryProvider.q`), nút bộ lọc (bottom sheet: trạng thái, sort theo số người ủng hộ). v1 có thể chỉ search + sort, để lọc nâng cao sau.
- Card nổi bật (item đầu) + danh sách card thường → 2 widget: `featured_fund_card.dart`, `fund_card.dart` (mô phỏng `FeaturedArticleDonationCard`/`ArticleDonationCard`). Mỗi card: logo (`CachedNetworkImage`), tên, người quản lý, khoảng thời gian, **progress bar** (% = currentAmount/targetAmount), số người ủng hộ.
- `RefreshIndicator` → `ref.invalidate(fundsProvider)`.
- Tap card → `context.push('/fundraising/$id')`.

### 6.2 `fundraising_detail_page.dart` (FundDetailPage)
- `ref.watch(fundDetailProvider(id))`.
- Banner logo, tên, panel tiến độ (`fund_progress_panel.dart`: đã quyên / mục tiêu, progress bar, số người ủng hộ, mức TB = current/donorCount, người quản lý, thời gian bắt đầu–kết thúc, trạng thái).
- Mô tả đầy đủ HTML qua `HtmlWidget` (`flutter_widget_from_html_core`).
- Nút **"Đóng góp"** cố định dưới (ẩn/disable nếu `isClosed` hoặc hết hạn) → `context.push('/fundraising/$id/donate')`.

> **KHÔNG** có section "Danh sách người đóng góp" — đó là chức năng quản lý của admin.

### 6.3 `fundraising_donate_page.dart` (DonatePage)
- `ConsumerStatefulWidget`. Form:
  - Chọn mức: chips `100.000 / 200.000 / 500.000 / 1.000.000 / Tùy chọn` → nếu tùy chọn hiện ô nhập (validate > 0).
  - Switch **Ẩn danh**. Nếu KHÔNG ẩn danh: ô Tên (bắt buộc, ≤50), Email (tùy chọn, đúng định dạng, ≤255), SĐT (≤50), Địa chỉ (≤500), Lời nhắn (≤100).
  - Nếu user đã đăng nhập & không ẩn danh: prefill tên/email từ profile; gửi `donor_member_id`.
- Submit → `createDonation(...)` → nhận `checkoutUrl`.
- Hiển thị **dialog QR**: `CachedNetworkImage(checkoutUrl)`; nếu lỗi tải ảnh → hiện link + nút "Mở liên kết thanh toán" (`url_launcher`). Có ghi chú "Quét QR bằng app ngân hàng để hoàn tất". Nút Đóng → quay lại detail + invalidate.

### 6.4 `my_donations_page.dart` (lịch sử của tôi) — tùy chọn v1
- `ref.watch(myDonationsProvider)`; list card đóng góp (tên quỹ nếu có, số tiền, trạng thái PENDING/SUCCESS/FAILED, thời gian). Vào từ trang Profile ("Lịch sử đóng góp").

### Widgets dùng lại
`SkeletonList`, `ErrorView`, `CachedNetworkImage`, `HtmlWidget`, theme `AppColors`/`AppSpacing`.

---

## 7. Routing & Entry point

### 7.1 Thay placeholder bằng trang thật (`app_router.dart` dòng 297-303)
```dart
GoRoute(
  path: RouteNames.fundraising,
  builder: (_, __) => const MainScaffold(currentIndex: <i>, child: FundsPage()),
),
GoRoute(
  path: '${RouteNames.fundraising}/:id',
  builder: (_, state) => FundDetailPage(
    fundId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0),
),
GoRoute(
  path: '${RouteNames.fundraising}/:id/donate',
  builder: (_, state) => DonatePage(
    fundId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0),
),
```
(Lịch sử: `GoRoute('/fundraising/my-donations' → MyDonationsPage)` nếu làm.)

### 7.2 Cách vào tính năng — **CẦN QUYẾT ĐỊNH**
Nav bar đang đủ 5 tab. Hai lựa chọn:
- **(A) Thêm vào Home** một mục/icon "Đóng góp & Quỹ" → `context.go('/fundraising')`. Ít xáo trộn nav. *(Khuyến nghị)*
- **(B) Thay/chèn 1 tab** trong `main_scaffold.dart` (vd thay tab ít dùng) — đụng tới index của các tab khác.

> Nếu chọn (A), `FundsPage` có thể **không** bọc `MainScaffold` (mở full-screen như các trang con),
> hoặc bọc `MainScaffold` với `currentIndex` của tab Home. Quyết định trước khi code route.

---

## 8. Thứ tự triển khai (đề xuất)

1. **Models** (`fund_summary`, `fund_detail`, `fund_donation`, `fund_receiving_info`) + tái dùng `PaginatedResponse`.
2. **api_endpoints**: thêm `fundDonationsByUser`, (`fundBanks` nếu cần).
3. **Repository** + `fundraisingRepositoryProvider`.
4. **Providers** (`fundQuery`, `funds`, `fundDetail`, `myDonations`).
5. **List page** + card widgets + progress bar → wiring route `/fundraising` (thay placeholder).
6. **Detail page** + progress panel + HTML + nút Đóng góp.
7. **Donate page** + form validate + dialog QR (`url_launcher` fallback).
8. **Entry point** (mục/icon ở Home) — chốt theo Mục 7.2.
9. *(Tùy chọn)* **My donations** + link ở Profile.
10. Chạy `flutter analyze`, test thủ công list → detail → donate → QR.

---

## 9. Lưu ý / Rủi ro

- **donor_member_id & userId**: lấy từ JWT/`authState`. Xác nhận field name trong token và cách
  web lấy `userId` (`useUserDonations.js`). Nếu user chưa đăng nhập vẫn quyên góp được (ẩn danh, `donor_member_id=null`).
- **Tên field snake_case** trong `POST /fund-donations` (`donor_member_id`, `donor_name`,
  `description_short/full`) — khác convention camelCase, giữ đúng như backend DTO.
- **checkoutUrl là ảnh QR** (SePay `qr.sepay.vn/img`), KHÔNG phải trang web → dùng `Image`/`CachedNetworkImage`,
  không mở browser. Fallback `url_launcher` chỉ khi ảnh lỗi.
- **Trạng thái thanh toán** cập nhật bất đồng bộ qua webhook SePay (backend) → sau khi quét QR,
  donation từ PENDING→SUCCESS. Mobile không poll; lịch sử sẽ hiển thị trạng thái khi refresh.
- **Tiền tệ**: format VND (vd `NumberFormat` hoặc helper hiện có). targetAmount/currentAmount là VND nguyên.
- **organizationId**: kiểm tra web có truyền filter theo org đang chọn không; nếu có, gắn `organizationId`
  từ `organizationState` vào `getFunds`.
- **KHÔNG** import/đụng tới bất kỳ màn admin nào. `fundClose` endpoint để nguyên, không gọi.

---

## 10. Checklist hoàn thành (USER)

- [ ] Xem danh sách quỹ (card + progress + nổi bật) — có search & sort.
- [ ] Xem chi tiết quỹ (mô tả HTML, panel tiến độ).
- [ ] Quyên góp: chọn mức / tùy chọn, ẩn danh hoặc nhập thông tin, validate.
- [ ] Nhận & hiển thị QR thanh toán (fallback mở link).
- [ ] (Tùy chọn) Lịch sử đóng góp của tôi.
- [ ] Entry point vào tính năng (Home) + route con đầy đủ.
- [ ] `flutter analyze` sạch; test thủ công luồng đầy đủ.
