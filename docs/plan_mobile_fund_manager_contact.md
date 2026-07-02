# Plan: Người liên hệ / phụ trách Quỹ (Fund Manager Contact) trên Mobile (Flutter)

> Ngày tạo: 2026-07-01
> Feature tracker: C22 — "Mỗi quỹ thêm người liên hệ (chat trên AlumVerse nếu có, else email)".
> Mục tiêu: **port** tính năng Fund Manager Contact từ `frontend/` (React) sang `mobile_flutter/`
> (Flutter + Riverpod + Dio + go_router), bám sát bản web đã triển khai.
>
> Tham chiếu:
> - Web (đã làm xong FE + BE): [plan_fund_manager_contact.md](./plan_fund_manager_contact.md).
> - Mobile fundraising (list → detail → donate): [plan_mobile_fundraising_feature.md](./plan_mobile_fundraising_feature.md).
> - Mobile network (message sheet / connection request): [plan_mobile_network_feature.md](./plan_mobile_network_feature.md).

---

## 0. TL;DR — Phạm vi trên mobile hẹp hơn web

Web đụng **2 nửa**: (a) form tạo/sửa quỹ thêm field `manager_email` (§3.1 web), và (b) trang chi tiết
quỹ hiện email + nút "Kết nối" nối vào `NetworkMessageDrawer` (§3.2–3.3 web).

**Mobile chỉ có nửa (b).** Lý do: theo [plan_mobile_fundraising_feature.md](./plan_mobile_fundraising_feature.md)
mục 1, mobile **cố ý KHÔNG làm phần ADMIN** — không có màn tạo/sửa/đóng quỹ. Vì vậy trên mobile
tính năng này **thuần hiển thị + hành động** ở trang chi tiết quỹ:

> Hiện **email người phụ trách**, và nếu người đó là thành viên hệ thống → nút **"Kết nối"**
> mở bottom sheet gửi yêu cầu kết nối (tái dùng `message_request_sheet` của feature Network).

**Backend: KHÔNG cần đổi gì.** `FundDetailResponse` **đã** trả sẵn 3 field mới
(`managerEmail`, `managerUserId`, `managerAvatarUrl`) — đã verify:

```
backend/.../fundraising/dto/FundDetailResponse.java
  40:  private String managerEmail;
  41:  private Integer managerUserId;    // null nếu email không khớp user nào
  42:  private String managerAvatarUrl;
  69:  .managerEmail(fund.getManagerEmail())
  70:  .managerUserId(managerUser != null ? managerUser.getId() : null)
  71:  .managerAvatarUrl(managerUser != null ? managerUser.getAvatarUrl() : null)
```

→ Toàn bộ công việc là **client-side Flutter**: parse thêm field + thêm UI ở trang chi tiết.

---

## 1. Hiện trạng — Gap Analysis

| Thành phần | File | Trạng thái |
|---|---|---|
| Backend trả `managerEmail/managerUserId/managerAvatarUrl` | `FundDetailResponse.java` | ✅ **Đã có** (không cần đụng) |
| Model `FundDetail` (mobile) | `features/fundraising/data/models/fund_detail.dart` | ⚠️ Parse `managerName` nhưng **thiếu** 3 field mới |
| Trang chi tiết quỹ | `features/fundraising/presentation/pages/fundraising_detail_page.dart` | ⚠️ `_ProgressPanel` đã có dòng "Người quản lý" (dòng 186–187) — **chưa** có email + nút Kết nối |
| Bottom sheet gửi yêu cầu kết nối | `features/network/presentation/widgets/message_request_sheet.dart` | ✅ **Đã có & tái dùng được** — `showMessageRequestSheet(context, targetMemberId, targetName)` |
| Repo network (`getConnectionStatus`, `sendConnectionRequest`) | `features/network/data/repositories/network_repository.dart` | ✅ **Đã có** (sheet tự gọi bên trong) |
| Current user id | `authStateProvider.valueOrNull?.user?.id` (String) | ✅ Có sẵn (pattern giống `fundraising_provider.dart`) |
| i18n | `assets/translations/{vi,en}.json` (easy_localization) | ⚠️ Cần thêm vài key `donation.*` |

**Kết luận:** hạ tầng gần như sẵn sàng. Việc còn lại: **parse 3 field + thêm 1 khối UI** (email + nút)
vào `_ProgressPanel`, wiring vào `showMessageRequestSheet`, và thêm i18n. Ước tính rất nhỏ, gói gọn
trong 2 file chính + 1 file i18n.

---

## 2. Thay đổi Model — `fund_detail.dart`

File: `mobile_flutter/lib/features/fundraising/data/models/fund_detail.dart`

Thêm 3 field vào class `FundDetail`:

```dart
final String? managerEmail;
final int? managerUserId;    // null nếu email không khớp user hệ thống nào
final String? managerAvatarUrl;
```

Trong constructor: thêm `this.managerEmail, this.managerUserId, this.managerAvatarUrl,`.

Trong `fromJson`:

```dart
managerEmail: json['managerEmail'] as String?,
managerUserId: (json['managerUserId'] as num?)?.toInt(),
managerAvatarUrl: json['managerAvatarUrl'] as String?,
```

> Lưu ý parse `managerUserId` qua `(… as num?)?.toInt()` (không `as int?`) để an toàn nếu BE serialize
> thành số khác kiểu — đồng nhất với cách `donorCount`/`id` đang parse trong file.

(Tuỳ chọn) helper tiện dụng trên model, dùng cho logic hiển thị nút (xem §4):

```dart
bool get hasSystemManager => managerUserId != null;
```

---

## 3. Bottom sheet "Kết nối" — tái dùng `message_request_sheet`, thêm biến thể ngữ cảnh

Web thêm prop `variant="connect"` cho `NetworkMessageDrawer` để đổi tiêu đề/dòng phụ/ghi chú ngữ cảnh
mà **giữ nguyên logic** gửi (§3.3.1 web), **backward-compatible** (default = hành vi cũ). Ta làm y hệt
trên mobile với `showMessageRequestSheet`.

### 3.1. Mở rộng chữ ký hàm (backward-compatible)

File: `features/network/presentation/widgets/message_request_sheet.dart`

Thêm **2 param tuỳ chọn**, default `null` = hành vi cũ (các chỗ đang gọi ở tab Network **không cần sửa**):

```dart
Future<void> showMessageRequestSheet(
  BuildContext context, {
  required int targetMemberId,
  required String targetName,
  String? title,        // MỚI: override tiêu đề header (mặc định 'network.message_to')
  String? contextNote,  // MỚI: Alert ngữ cảnh đầu sheet (mặc định null = không hiện)
}) { ... }
```

Truyền tiếp xuống `_MessageRequestSheet` (2 field mới, nullable).

**Điều chỉnh hiển thị bên trong** (chỉ text/banner, **KHÔNG đụng** logic `getConnectionStatus`/`sendConnectionRequest`):

1. **Header** (dòng ~139): nếu `title != null` → dùng `title`, else giữ
   `'network.message_to'.tr(namedArgs: {'name': targetName})`.
2. **Context note**: nếu `contextNote != null` → render 1 `Container`/Alert info (dùng lại style khối
   `AppColors.primaryLighter` + `Icons.info_outline` đã có trong `_buildComposer`, dòng ~230–248) đặt
   **ngay đầu** vùng nội dung, **không đè** banner trạng thái sẵn có.

> Đây là chỉnh nhẹ, đúng tinh thần web: người dùng đang xem quỹ (không phải trang Network) nên cần
> một dòng giải thích "đây là yêu cầu kết nối tới người phụ trách quỹ, không phải chat tức thời".

### 3.2. Ánh xạ web → mobile (đã có sẵn, không cần làm gì thêm)

| Web (`NetworkMessageDrawer`) | Mobile (`message_request_sheet`) |
|---|---|
| `peer.userId` (bắt buộc) | `targetMemberId` |
| Logic status (null/PENDING/ACCEPTED/REJECTED + cooldown) | ✅ đã port đủ trong `_buildContent()` |
| `POST /chat/conversation-requests` | `networkRepository.sendConnectionRequest(...)` ✅ |
| `GET .../connection-status` | `networkRepository.getConnectionStatus(...)` ✅ |
| `peer.avatarUrl = managerAvatarUrl` | *(sheet hiện chưa hiển thị avatar — bỏ qua, hoặc thêm sau; không bắt buộc cho v1)* |
| `peer.fullName` (fallback nếu thiếu) | `targetName` — ta truyền `managerName` (fallback nếu null, xem §4) |

> **`managerUserId` = `users.id` = "memberId" trong module chat** — đã verify ở plan web (§2.4, §6):
> chat dùng "memberId" chỉ là alias của `users.id`. Nên truyền thẳng `managerUserId` vào
> `targetMemberId`, **không cần** field id khác.

---

## 4. UI trang chi tiết quỹ — email + nút Kết nối

File: `features/fundraising/presentation/pages/fundraising_detail_page.dart`

Vị trí: trong `_ProgressPanel` (StatelessWidget), **ngay dưới** dòng "Người quản lý" hiện có (dòng 186–187).
Đề xuất tách thành widget con `_ManagerContact` (`ConsumerWidget`) để lấy được `currentUserId` từ Riverpod
(hiện `_ProgressPanel` là `StatelessWidget` — hoặc đổi nó thành `ConsumerWidget`).

### 4.1. Dòng email (luôn hiện khi có)

```dart
if (fund.managerEmail != null && fund.managerEmail!.isNotEmpty)
  _row(Icons.email_outlined, 'donation.manager_email'.tr(), fund.managerEmail!),
```

> Web coi email là bắt buộc (cột NOT NULL). Mobile vẫn guard rỗng cho an toàn với dữ liệu cũ.

### 4.2. Nút Kết nối — render có điều kiện (bám bảng web §3.2)

Lấy current user id (pattern có sẵn trong `fundraising_provider.dart` dòng 88–89):

```dart
final rawId = ref.watch(authStateProvider).valueOrNull?.user?.id;
final currentUserId = rawId != null ? int.tryParse(rawId) : null;
```

| Trường hợp | Hiển thị |
|---|---|
| `managerUserId == null` (không phải user hệ thống) | Chỉ email, **không** nút |
| `managerUserId == currentUserId` (mình là người phụ trách) | Email + chip **"Bạn là người phụ trách quỹ này"**, **ẩn** nút |
| `managerUserId != null` & khác mình | Email + nút **"Kết nối"** → mở sheet |
| Chưa đăng nhập (`currentUserId == null`), `managerUserId != null` | **Vẫn hiện** nút "Kết nối"; bấm → điều hướng/nhắc đăng nhập (xem §6, điểm mở) |

Nút gọi sheet biến thể "connect":

```dart
OutlinedButton.icon(
  onPressed: () {
    // Nếu chưa đăng nhập: điều hướng login (xem §6). Ngược lại:
    showMessageRequestSheet(
      context,
      targetMemberId: fund.managerUserId!,
      targetName: (fund.managerName?.isNotEmpty ?? false)
          ? fund.managerName!
          : 'donation.fund_manager'.tr(),          // fallback "Người phụ trách quỹ"
      title: 'donation.contact_manager_title'.tr(), // "Người phụ trách quỹ"
      contextNote: 'donation.contact_manager_note'.tr(), // giải thích đây là yêu cầu kết nối
    );
  },
  icon: const Icon(Icons.connect_without_contact),
  label: Text('donation.connect'.tr()),
)
```

> **Case "mình là manager"** chỉ ẩn nút cho gọn UX — **backend đã an toàn sẵn**: cả
> `createConversationRequest` lẫn `getConnectionStatus` chặn `currentMemberId == targetMemberId`
> (ném BAD_REQUEST). Không cần guard thêm ở mobile.

---

## 5. i18n — `assets/translations/{vi,en}.json`

Các key **network.\*** mà sheet dùng (`message_to`, `send_first_message_banner`, `message_hint`,
`send_message_btn`, `waiting_reply_banner`, `connection_request_sent`, `message_sent_hint`,
`cooldown_banner`, `resend_banner`, `accepted_banner`, `open_inbox`) — **đã tồn tại**, không cần thêm.

Key `donation.manager` — **đã có**. Cần **thêm** vào block `donation`:

| Key | vi | en |
|---|---|---|
| `donation.manager_email` | "Email người phụ trách" | "Manager email" |
| `donation.connect` | "Kết nối" | "Connect" |
| `donation.fund_manager` | "Người phụ trách quỹ" | "Fund manager" |
| `donation.contact_manager_title` | "Người phụ trách quỹ" | "Fund manager" |
| `donation.contact_manager_note` | "Đây là yêu cầu kết nối — người phụ trách sẽ nhận và phản hồi, không phải tin nhắn tức thời." | "This is a connection request — the manager will receive and respond; it is not instant messaging." |
| `donation.you_are_manager` | "Bạn là người phụ trách quỹ này" | "You manage this fund" |
| `donation.login_to_connect` *(nếu chọn hướng nhắc login)* | "Đăng nhập để kết nối với người phụ trách" | "Log in to connect with the manager" |

---

## 6. Rủi ro & điểm cần chốt

1. **Chưa đăng nhập bấm "Kết nối"** — cần chốt hành vi mobile:
   - **(A)** Vẫn hiện nút; bấm → `context.push(RouteNames.login)` hoặc SnackBar nhắc đăng nhập
     (bám web — web vẫn hiện nút rồi nhắc login). *(Khuyến nghị)*
   - **(B)** Ẩn nút khi `currentUserId == null` (đơn giản hơn, nhưng lệch web).
   > Lưu ý: sheet gọi `getConnectionStatus`/`sendConnectionRequest` cần Bearer token; nếu để mở sheet
   > khi chưa login sẽ 401 → nên chặn **trước** khi mở sheet (hướng A xử lý ở `onPressed`).

2. **`_ProgressPanel` là `StatelessWidget`** → cần `currentUserId` từ Riverpod. Đổi sang `ConsumerWidget`
   **hoặc** tách riêng `_ManagerContact extends ConsumerWidget`. Khuyến nghị tách widget con cho gọn.

3. **Avatar người phụ trách trong sheet**: web truyền `peer.avatarUrl = managerAvatarUrl`, nhưng
   `message_request_sheet` mobile **hiện chưa** render avatar ở header. Bỏ qua ở v1 (không ảnh hưởng
   chức năng), hoặc thêm param `avatarUrl` sau nếu muốn ngang web.

4. **Đổi email của manager làm mất khớp** → mất nút Kết nối (self-healing hai chiều) — đánh đổi đã chấp
   nhận từ v1 web, mobile kế thừa, không cần xử lý thêm.

5. **KHÔNG có màn tạo/sửa quỹ trên mobile** → không port §3.1 web. Nếu sau này mobile làm admin, mới bổ
   sung field `manager_email` vào form (ngoài phạm vi lần này).

---

## 7. Thứ tự thực hiện

1. `fund_detail.dart` — thêm 3 field + parse (§2).
2. `message_request_sheet.dart` — thêm 2 param `title` / `contextNote`, backward-compatible (§3.1).
3. `fundraising_detail_page.dart` — tách `_ManagerContact` (ConsumerWidget), thêm dòng email + nút Kết
   nối theo bảng điều kiện (§4). Chốt hành vi chưa-đăng-nhập (§6.1).
4. i18n: thêm key `donation.*` cho `vi.json` + `en.json` (§5).
5. `flutter analyze` sạch; test thủ công theo §8.

---

## 8. Test plan (thủ công)

- [ ] Quỹ có manager **là** user hệ thống → chi tiết hiện email + nút **Kết nối** → bấm mở sheet (title
      "Người phụ trách quỹ" + note ngữ cảnh), gửi được yêu cầu kết nối (status `null` → `PENDING`).
- [ ] Quỹ có manager **không** thuộc hệ thống (`managerUserId == null`) → chỉ email, **không** nút.
- [ ] **Mình là manager** (`managerUserId == currentUserId`) → **không** nút, hiện chip "Bạn là người phụ
      trách quỹ này".
- [ ] **Chưa đăng nhập** → theo hướng đã chốt (§6.1): nút hiện & bấm → nhắc/điều hướng login (A) hoặc ẩn (B).
- [ ] Các trạng thái sheet: `PENDING` (chờ phản hồi), `ACCEPTED` (nút mở `/chat`), `REJECTED` + cooldown
      (khoá + đếm ngược), `REJECTED` hết cooldown (gửi lại 1 lần) — tái dùng logic Network, chỉ verify không
      vỡ khi vào từ luồng quỹ.
- [ ] **Regression**: mở sheet từ tab Network (không truyền `title`/`contextNote`) → header & giao diện
      **không đổi** (default giữ nguyên).
- [ ] `flutter analyze` không lỗi/không warning mới.

---

## 9. Checklist file

### Sửa
- [ ] `features/fundraising/data/models/fund_detail.dart` — +3 field + parse.
- [ ] `features/network/presentation/widgets/message_request_sheet.dart` — +`title`, +`contextNote` (default null).
- [ ] `features/fundraising/presentation/pages/fundraising_detail_page.dart` — dòng email + nút Kết nối + `_ManagerContact`.
- [ ] `assets/translations/vi.json` + `assets/translations/en.json` — thêm key `donation.*` (§5).

### KHÔNG cần
- [x] Backend — `FundDetailResponse` đã trả sẵn 3 field.
- [x] `api_endpoints.dart` — dùng lại `fundDetail(id)` + endpoint chat/network đã có.
- [x] Repo mới / model mới — tái dùng `NetworkRepository` + `ConnectionStatus` sẵn có.
- [x] Màn tạo/sửa quỹ — không tồn tại trên mobile (ngoài phạm vi).
