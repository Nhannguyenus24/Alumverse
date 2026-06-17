# Plan: Hoàn thiện tính năng Network trên Mobile (Flutter)

> Mục tiêu: port đầy đủ tính năng **Network ("Kết nối")** từ `frontend/` (React) sang
> `mobile_flutter/` (Flutter + Riverpod + Dio + go_router), để mobile đạt ngang
> tính năng với web.
>
> Tham chiếu web: [plan_network_connections_feature.md](./plan_network_connections_feature.md),
> [plan_block_user_feature.md](./plan_block_user_feature.md).

---

## 1. Hiện trạng — Gap Analysis

### Web frontend có gì (7 sub-features)

| # | Sub-feature | Route web | API chính |
|---|---|---|---|
| 1 | **Tìm kiếm thành viên** (directory) | `/:slug/search` | `GET /api/chat/network/members` |
| 2 | **Yêu cầu kết nối đến** (incoming) | `/:slug/search/requests` | `GET /api/chat/conversation-requests/search`, `PUT /api/chat/conversation-requests/respond` |
| 3 | **Kết nối hiện tại** | `/:slug/search/connections` | `GET /api/chat/connections/search` |
| 4 | **Người đã chặn** | `/:slug/search/restricted-connections` | `GET /api/chat/blocks` |
| 5 | **Nhắn tin trong network** (message drawer) | (drawer trên các card) | `GET /api/chat/conversation-requests/connection-status`, `POST /api/chat/conversation-requests` |
| 6 | **Chặn / Bỏ chặn** | (menu trên card) | `POST` / `DELETE` / `GET /api/chat/blocks/{targetMemberId}` |
| 7 | **Điều hướng tới profile** | → `/:slug/profile/:userId` | (chỉ navigation) |

### Mobile hiện có gì

| File | Nội dung |
|---|---|
| `features/network/data/models/network_member.dart` | Model `NetworkMember` (userId, fullName, program, major, avatarUrl) |
| `features/network/data/repositories/network_repository.dart` | Chỉ `searchMembers({fullName, program, major, page, size})` → `GET /api/chat/network/members` |
| `features/network/presentation/providers/network_provider.dart` | Chỉ `featuredMembersProvider` (6 members cho section "Cộng đồng" ở Home) |
| `core/router/app_router.dart` | Route `/network` → **`FeaturePlaceholderPage`** (chưa có UI thật) |
| `core/constants/api_endpoints.dart` | Đã có: `networkMembers`, `chatConnectionStatus`, `chatConversationRequests`, `chatConversationRequestRespond`, `chatConversationRequestSearch`. **Thiếu:** `connections/search`, `blocks` (list + block + unblock) |

### Kết luận: **CHƯA hoàn thành.** Mức độ hoàn thành ~10–15%

| # | Sub-feature | Trạng thái mobile |
|---|---|---|
| 1 | Tìm kiếm thành viên | ⚠️ **Một phần** — có `searchMembers()` ở repo nhưng **chưa có màn hình** với search bar / filter program-major / pagination. Hiện chỉ dùng cho Home. |
| 2 | Yêu cầu kết nối đến | ❌ **Thiếu hoàn toàn** |
| 3 | Kết nối hiện tại | ❌ **Thiếu hoàn toàn** (cả endpoint trong `api_endpoints.dart`) |
| 4 | Người đã chặn | ❌ **Thiếu hoàn toàn** (cả endpoint) |
| 5 | Nhắn tin trong network | ❌ **Thiếu hoàn toàn** (endpoint đã có sẵn, chưa dùng) |
| 6 | Chặn / Bỏ chặn | ❌ **Thiếu hoàn toàn** (cả endpoint) |
| 7 | Điều hướng tới profile | ❌ **Thiếu** (phụ thuộc route `/profile/:id` của feature `user`) |
| — | Màn hình Network + tab navigation | ❌ Route `/network` vẫn là placeholder |

> Backend **đã hỗ trợ đầy đủ** mọi endpoint (xem 2 plan web tham chiếu). Đây thuần là
> công việc **client-side trên mobile**, không cần thay đổi backend.

---

## 2. Kiến trúc đề xuất (theo convention `features/mentorship`)

Tuân theo pattern Clean Architecture đang dùng trong `mobile_flutter`:

```
lib/features/network/
├── data/
│   ├── models/
│   │   ├── network_member.dart              # (đã có) — directory item
│   │   ├── connection.dart                  # MỚI — kết nối ACCEPTED
│   │   ├── conversation_request.dart        # MỚI — incoming request item
│   │   ├── blocked_member.dart              # MỚI — người đã chặn
│   │   └── connection_status.dart           # MỚI — status + cooldown + latestMessage
│   └── repositories/
│       ├── network_repository.dart          # (mở rộng) — thêm connections/blocks/requests/status/send
│       └── block_repository.dart            # MỚI (tùy chọn tách) — block/unblock/check
├── presentation/
│   ├── providers/
│   │   └── network_provider.dart            # (mở rộng) — query state + FutureProviders cho từng list
│   ├── pages/
│   │   ├── network_page.dart                # MỚI — shell có TabBar 4 tab
│   │   ├── network_search_tab.dart          # MỚI — Sub-feature 1
│   │   ├── network_requests_tab.dart        # MỚI — Sub-feature 2
│   │   ├── network_connections_tab.dart     # MỚI — Sub-feature 3
│   │   └── network_blocked_tab.dart         # MỚI — Sub-feature 4
│   └── widgets/
│       ├── network_member_card.dart         # MỚI — card directory + actions
│       ├── connection_card.dart             # MỚI
│       ├── conversation_request_card.dart   # MỚI
│       ├── blocked_member_card.dart         # MỚI
│       ├── message_request_sheet.dart       # MỚI — bottom sheet thay cho web drawer (Sub-feature 5)
│       └── network_search_bar.dart          # MỚI — search + filter dùng chung
```

**Lý do dùng TabBar thay vì sidebar:** web dùng sidebar 4 mục (`networkSidebarConfig.jsx`).
Trên mobile, pattern tự nhiên là một `NetworkPage` với `TabBar`/`SegmentedButton` 4 tab:
**Tìm kiếm · Yêu cầu · Kết nối · Đã chặn** (giữ nguyên label tiếng Việt của web).

**Bottom sheet thay cho drawer:** web mở `NetworkMessageDrawer` ở cạnh phải. Trên mobile,
dùng `showModalBottomSheet` (`message_request_sheet.dart`) để gửi tin nhắn kết nối ban đầu.

---

## 3. API endpoints cần thêm

### `core/constants/api_endpoints.dart` — bổ sung

```dart
// --- Network connections ---
static const String connectionsSearch = '/api/chat/connections/search';

// --- Blocks ---
static const String blocks = '/api/chat/blocks';                 // GET (list+search+page), 
static String blockUser(int memberId) => '/api/chat/blocks/$memberId'; // POST block / DELETE unblock / GET check

// --- Public profile (cho Sub-feature 7) ---
static String publicProfile(int userId) => '/api/users/$userId/public-profile';
```

> **Lưu ý prefix:** endpoint mobile **có** prefix `/api` (vd `/api/chat/...`), khác web
> (`/chat/...`). Bám theo các hằng đã có trong `api_endpoints.dart`.

> Các endpoint cho Sub-feature 2 & 5 **đã có sẵn** trong `api_endpoints.dart`:
> `chatConversationRequestSearch`, `chatConversationRequestRespond`,
> `chatConnectionStatus`, `chatConversationRequests`.

### Bảng hợp đồng API (đầy đủ)

| Sub-feature | Method + Path | Query / Body | Response |
|---|---|---|---|
| 1 Directory | `GET /api/chat/network/members` | `fullName, program, major, page, size` | `{ items[], totalPage, totalItem }` |
| 2 Incoming list | `GET /api/chat/conversation-requests/search` | `fullName, status(PENDING\|REJECTED), page, size` | `{ items[], totalPage, totalItem }` |
| 2 Respond | `PUT /api/chat/conversation-requests/respond` | body `{ id, status: ACCEPTED\|REJECTED }` | request object |
| 3 Connections | `GET /api/chat/connections/search` | `fullName, page, size` | `{ items[], totalPage, totalItem }` |
| 4 Blocked list | `GET /api/chat/blocks` | `fullName, page, size` | `{ items[], totalPage, totalItem }` |
| 5 Status | `GET /api/chat/conversation-requests/connection-status` | `targetMemberId` | `{ status, cooldownUntil, latestMessage }` |
| 5 Send | `POST /api/chat/conversation-requests` | body `{ targetMemberId, message }` | request object |
| 6 Block | `POST /api/chat/blocks/{targetMemberId}` | — | block object |
| 6 Unblock | `DELETE /api/chat/blocks/{targetMemberId}` | — | confirm |
| 6 Check | `GET /api/chat/blocks/{targetMemberId}` | — | block status |

> **Lưu ý parse:** `page` API là **0-based**. Response bọc trong `ApiResponse` → lấy
> `res.data['data']`, rồi `data['items']` / `data['totalPage']` (giống `network_repository.searchMembers` đã làm).

---

## 4. Kế hoạch theo từng Sub-feature

### Sub-feature 1 — Tìm kiếm thành viên (nâng cấp từ repo có sẵn)

- **Model:** dùng lại `NetworkMember`.
- **Repository:** đã có `searchMembers()` — bổ sung trả `totalPage`/`totalItem` (hiện chỉ trả `List`). Cân nhắc tạo lớp `Paginated<T>` dùng chung.
- **Provider:** thêm `NetworkSearchQuery` (StateProvider: fullName, program, major, page) + `FutureProvider` list.
- **UI:** `network_search_tab.dart` — search bar (Enter để apply), 2 ô **filter program/major dạng text tự do** (xem chốt bên dưới), grid/list card, pagination (PAGE_SIZE = 5 theo web).

> **Chốt nguồn filter program/major (đã discuss):** Trên web (`NetworkPage.jsx`), filter
> **KHÔNG** phải dropdown từ API — chỉ là 2 `TextField` tự do (`DynamicFilterBar` với
> `type: 'input'`, placeholder `"VD: Regular, Advanced Program…"` / `"VD: Computer Science…"`).
> User gõ chuỗi → gửi thẳng thành query param `program` / `major` (backend partial match).
> → Mobile chỉ cần **2 `TextField`** + một toggle "Tất cả" (giống cờ `filters.all` của web để
> bỏ qua filter). **Không cần** endpoint danh sách options.
- **Card actions:** "Nhắn tin" (mở `message_request_sheet`), menu "Chặn", tap → profile.

### Sub-feature 2 — Yêu cầu kết nối đến

- **Model MỚI:** `conversation_request.dart` (id, requester {id, fullName, avatarUrl}, message, status, sentAt).
- **Repository:** `searchIncomingRequests({fullName, status, page, size})`, `respondRequest({id, status})`.
- **Provider:** query state (fullName, status filter PENDING/REJECTED, page) + list provider + mutation.
- **UI:** `network_requests_tab.dart` — list card; card có nút **Chấp nhận** / **Từ chối** (chỉ khi PENDING) + dialog xác nhận; tap mở chi tiết (bottom sheet) xem full message.
- **Sau respond:** invalidate list requests + list connections.

### Sub-feature 3 — Kết nối hiện tại

- **Model MỚI:** `connection.dart` (connectionId, chatGroupId, peerMemberId, fullName, avatarUrl, program, major, connectedAt).
- **Repository:** `searchConnections({fullName, page, size})`.
- **UI:** `network_connections_tab.dart` — list/grid card; actions: **Nhắn tin** → điều hướng `/chat` (xem ràng buộc bên dưới), menu **Chặn**.

### Sub-feature 4 — Người đã chặn

- **Model MỚI:** `blocked_member.dart` (memberId, fullName, avatarUrl, blockedAt).
- **Repository:** `searchBlockedMembers({fullName, page, size})`.
- **UI:** `network_blocked_tab.dart` — list card; action duy nhất **Bỏ chặn** + dialog xác nhận.
- **Sau unblock:** invalidate `blockedMembers` + `connections` + (nếu có) chat list.

### Sub-feature 5 — Nhắn tin trong network (bottom sheet)

- **Model MỚI:** `connection_status.dart` (status: PENDING/ACCEPTED/REJECTED/null, cooldownUntil, latestMessage).
- **Repository:** `getConnectionStatus(targetMemberId)`, `sendConnectionRequest({targetMemberId, message})`.
- **UI:** `message_request_sheet.dart` (`showModalBottomSheet`) — hiển thị status hiện tại, áp dụng quy tắc gửi:
  - chưa kết nối → gửi 1 tin (tạo PENDING);
  - PENDING → không gửi được, chờ phản hồi;
  - ACCEPTED → điều hướng sang `/chat`;
  - REJECTED + còn cooldown → khóa input, hiện thời gian; hết cooldown → cho gửi lại 1 lần.
- TextField + nút Gửi, loading state.

### Sub-feature 6 — Chặn / Bỏ chặn

- **Repository** (tách `block_repository.dart` hoặc gộp vào network repo): `block(memberId)`, `unblock(memberId)`, `isBlocked(memberId)`.
- Dùng từ card ở Sub-feature 1, 3 (Chặn) và Sub-feature 4 (Bỏ chặn).
- Lỗi `409` (đã chặn) / `403` (bị peer chặn) → SnackBar lỗi (đọc message từ `error_interceptor.dart`).

### Sub-feature 7 — Điều hướng profile (→ tạo mới feature `user`)

- Tap vào card/tên → `context.push('/profile/$userId')`.

> **Chốt hiện trạng (đã discuss):** Mobile **CHƯA có** màn profile của người khác.
> - `features/user/` rỗng (chỉ `.gitkeep`).
> - `RouteNames.profile = '/profile'` (không param) → route trỏ `FeaturePlaceholderPage`.
> - Không có màn profile nào (trừ `mentor_profile_page.dart`, là domain mentor riêng).
>
> → **Phải xây mới** màn **Public Profile** trong `features/user/`. Đây là điều kiện cần để
> Sub-feature 7 hoạt động. Xem **Mục 4b** bên dưới.

**Web tham chiếu:** `PublicUserProfile.jsx` gọi `GET /users/{userId}/public-profile`
(hook `usePublicProfile`) → `{ userId, fullName, avatarUrl, coverUrl, currentJobTitle,
currentCompany, bio, email }`. Ngoài ra web còn render `UserHighlights` (bài viết alumni +
lịch sử đóng góp) — **bỏ qua ở MVP** (xem phạm vi đã chốt).

---

## 4b. Feature `user` — Màn Public Profile (MỚI)

> **Phạm vi đã chốt (đã discuss): Core profile.** Chỉ thông tin cơ bản, **bỏ** `UserHighlights`
> (posts/donations) vì feature `article`/`fundraising` trên mobile chưa sẵn sàng.

```
lib/features/user/
├── data/
│   ├── models/public_profile.dart        # MỚI
│   └── repositories/user_repository.dart # MỚI — getPublicProfile(userId)
└── presentation/
    ├── providers/user_provider.dart      # MỚI — publicProfileProvider (FutureProvider.family<…,int>)
    └── pages/public_profile_page.dart     # MỚI — màn hiển thị
```

| Thành phần | Chi tiết |
|---|---|
| **Endpoint** | `GET /api/users/{userId}/public-profile` |
| **Model `PublicProfile`** | `userId, fullName, avatarUrl, coverUrl, currentJobTitle, currentCompany, bio, email` |
| **UI** | Cover + avatar, họ tên, dòng chức danh `currentJobTitle @ currentCompany`, card "Giới thiệu" (bio), card "Thông tin cơ bản" (họ tên, email nếu có, công việc, công ty). Trạng thái thiếu → "Chưa cập nhật". |
| **Route** | `GoRoute('${RouteNames.profile}/:id')` → `PublicProfilePage(userId: …)` |
| **Loading/Error** | Dùng lại `LoadingView` / `ErrorView` trong `lib/shared/widgets/`. |

> Route `/profile` (không id) hiện vẫn là placeholder "Hồ sơ cá nhân" của chính mình — **giữ nguyên**,
> chỉ thêm route con `/profile/:id` cho profile người khác.

---

## 5. Routing & điều hướng

`core/router/app_router.dart` — thay route placeholder `/network`:

```dart
GoRoute(
  path: RouteNames.network,
  builder: (_, __) => const NetworkPage(),   // thay FeaturePlaceholderPage
),
```

- `NetworkPage` chứa `TabBar` 4 tab (hoặc `DefaultTabController`). Cân nhắc hỗ trợ
  query param chọn tab mặc định (vd `/network?tab=requests`) nếu cần deep-link từ Home/notification.
- Không cần thêm `RouteNames` mới cho 4 tab (nằm trong 1 page).

Thêm route profile người khác (cho Sub-feature 7):

```dart
GoRoute(
  path: '${RouteNames.profile}/:id',                 // '/profile/:id'
  builder: (_, state) => PublicProfilePage(
    userId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
  ),
),
```

---

## 6. Checklist file

### Tạo mới

- [ ] `data/models/connection.dart`
- [ ] `data/models/conversation_request.dart`
- [ ] `data/models/blocked_member.dart`
- [ ] `data/models/connection_status.dart`
- [ ] `data/repositories/block_repository.dart` *(hoặc gộp vào network_repository)*
- [ ] `presentation/pages/network_page.dart`
- [ ] `presentation/pages/network_search_tab.dart`
- [ ] `presentation/pages/network_requests_tab.dart`
- [ ] `presentation/pages/network_connections_tab.dart`
- [ ] `presentation/pages/network_blocked_tab.dart`
- [ ] `presentation/widgets/network_member_card.dart`
- [ ] `presentation/widgets/connection_card.dart`
- [ ] `presentation/widgets/conversation_request_card.dart`
- [ ] `presentation/widgets/blocked_member_card.dart`
- [ ] `presentation/widgets/message_request_sheet.dart`
- [ ] `presentation/widgets/network_search_bar.dart`

#### Feature `user` (Public Profile — cho Sub-feature 7)

- [ ] `features/user/data/models/public_profile.dart`
- [ ] `features/user/data/repositories/user_repository.dart`
- [ ] `features/user/presentation/providers/user_provider.dart`
- [ ] `features/user/presentation/pages/public_profile_page.dart`

### Sửa

- [ ] `core/constants/api_endpoints.dart` — thêm `connectionsSearch`, `blocks`, `blockUser(id)`, `publicProfile(userId)`
- [ ] `core/router/app_router.dart` — `/network` → `NetworkPage`; thêm route `/profile/:id` → `PublicProfilePage`
- [ ] `data/repositories/network_repository.dart` — thêm: `searchIncomingRequests`, `respondRequest`, `searchConnections`, `searchBlockedMembers`, `getConnectionStatus`, `sendConnectionRequest` (+ trả pagination cho `searchMembers`)
- [ ] `presentation/providers/network_provider.dart` — query states + FutureProviders cho từng list + mutations

---

## 7. Thứ tự triển khai (gợi ý)

1. `api_endpoints.dart` + models mới.
2. Mở rộng `network_repository.dart` (tất cả method) + `block_repository.dart`.
3. Providers (query state + list providers + invalidation).
4. `NetworkPage` shell + TabBar; route thay placeholder.
5. Tab 1 (Tìm kiếm) — tái dùng `searchMembers` đã có.
6. Tab 3 (Kết nối), Tab 4 (Đã chặn) — list + block/unblock.
7. Tab 2 (Yêu cầu) — list + accept/reject.
8. `message_request_sheet` (Sub-feature 5) + nối từ card.
9. Điều hướng profile (Sub-feature 7) — sau khi xác nhận route `/profile/:id`.
10. Test thủ công theo mục 9.

---

## 8. Các điểm đã chốt (sau discuss) & còn lại

### Đã chốt (17/06/2026)

| # | Vấn đề | Quyết định |
|---|---|---|
| 1 | Nguồn filter **program/major** | ✅ **Text tự do**, không phải dropdown/API. 2 `TextField` + toggle "Tất cả". Xem chốt ở Sub-feature 1. |
| 2 | Route profile `/profile/:id` trên mobile | ✅ **Chưa có → xây mới** feature `user` Public Profile (Mục 4b) + route `/profile/:id`. |
| 3 | Phạm vi màn Public Profile | ✅ **Core profile** (info cơ bản), **bỏ** UserHighlights ở MVP. |
| 4 | Phạm vi build session này | ✅ Build **cả network 4 tab + Public Profile**. |

### Còn lại (xác nhận khi triển khai)

| # | Vấn đề | Đề xuất |
|---|---|---|
| 5 | "Nhắn tin" khi ACCEPTED điều hướng `/chat` — mobile `ChatListPage` đã hỗ trợ auto-select chưa | Web **không** auto-select (out of scope). Mobile làm tương tự: chỉ `go('/chat')`. |
| 6 | TabBar vs route con riêng cho deep-link | Mặc định TabBar 1 page; thêm route con nếu cần notification deep-link. |
| 7 | PAGE_SIZE | Theo web: directory `size=5`, các list khác `size=5` (home dùng 6). Thống nhất `5` cho mobile. |

---

## 9. Test plan (thủ công)

- [ ] Tab Tìm kiếm: search theo tên, pagination, nút Nhắn tin mở sheet, Chặn hoạt động.
- [ ] Tab Yêu cầu: list PENDING/REJECTED, Chấp nhận/Từ chối + dialog, sau respond list cập nhật.
- [ ] Tab Kết nối: list đúng peer, Nhắn tin → `/chat`, Chặn → biến mất khỏi context phù hợp.
- [ ] Tab Đã chặn: list, Bỏ chặn + dialog, item biến mất sau unblock.
- [ ] Message sheet: đúng quy tắc theo status (none/pending/accepted/rejected+cooldown).
- [ ] Lỗi block 409/403 → SnackBar.
- [ ] Tap card → mở profile (nếu route sẵn sàng).
- [ ] Regression: section "Cộng đồng" ở Home (`featuredMembersProvider`) vẫn hoạt động.

---

## 10. Ngoài phạm vi (Out of scope)

- Realtime/websocket cho network (web cũng không dùng — chỉ Chat dùng `wsChat`).
- Deep-link auto-select conversation trong `/chat`.
- Hủy kết nối (xóa ACCEPTED request).
- Quản lý block phía admin, notification khi bị chặn.

---

## 11. Phụ lục — Field reference (lấy từ web hooks/cards/api.js)

> Tên field chính xác trong response để viết `fromJson`. `page` API là **0-based**;
> wrapper `ApiResponse` → unwrap `res.data['data']`.

**Pagination wrapper (chat/network):** `{ items: [...], totalPage: int, totalItem: int }`
— ⚠️ dùng **số ít** `totalPage`/`totalItem`, **khác** `PaginatedResponse` shared
(`totalPages`/`totalElements`). → parse riêng cho network, đừng tái dùng `PaginatedResponse.fromJson`.

| Model | Endpoint | Field |
|---|---|---|
| **NetworkMember** (đã có) | `network/members` | `userId, fullName, program, major, avatarUrl` |
| **ConversationRequest** (incoming) | `conversation-requests/search` | `id, status (PENDING\|REJECTED), message, messageCreatedAt, requesterMemberId, fullName, avatarUrl` |
| **Connection** | `connections/search` | `peerMemberId, fullName, avatarUrl, program, major` (+ `connectionId, chatGroupId, connectedAt`) |
| **BlockedMember** | `blocks` | `blockedMemberId, fullName, avatarUrl, blockedAt` |
| **ConnectionStatus** | `conversation-requests/connection-status?targetMemberId=` | `{ status, cooldownUntil, latestMessage }`, `latestMessage = { id, content, senderMemberId }`; **null** = chưa từng kết nối |
| **PublicProfile** | `users/{id}/public-profile` | `userId, fullName, avatarUrl, coverUrl, currentJobTitle, currentCompany, bio, email` |

**Body request:**
- Respond: `PUT conversation-requests/respond` body `{ id, status: ACCEPTED\|REJECTED }`
- Gửi tin: `POST conversation-requests` body `{ targetMemberId, message }`
- Block/Unblock: `POST` / `DELETE blocks/{targetMemberId}` (không body)

**Logic message sheet (Sub-feature 5)** — port từ `networkConnectionDrawerUi.js`:

| status | composer | banner |
|---|---|---|
| `null` (chưa kết nối) | ✅ gửi 1 tin | "Gửi tin nhắn đầu tiên để bắt đầu kết nối." |
| `PENDING` | ❌ | "Đang chờ người kia phản hồi…" |
| `ACCEPTED` | ❌ (→ điều hướng `/chat`) | "Hai người đã kết nối." |
| `REJECTED` + còn cooldown | ❌ | "…có thể gửi lại sau {cooldownUntil}." |
| `REJECTED` + hết cooldown | ✅ gửi 1 tin | "Bạn có thể gửi thêm 1 tin nhắn." |

> `cooldownExpired = DateTime.now() >= DateTime.parse(cooldownUntil)`. `singleMessageOnly`:
> sau khi gửi 1 tin trong phiên → khóa composer.

**`program`/`major` có thể là array hoặc JSON-string** (web `formatAcademicValue` join bằng `' · '`).
→ Mobile nên có helper coerce `dynamic → String?` (xử lý `String` / `List`), tránh `as String?`
làm rớt giá trị khi BE trả mảng. (Hiện `NetworkMember.fromJson` đang ép `as String?` — cân nhắc sửa cùng.)

---

## 12. Phụ lục — Convention mobile cần bám (để code khớp codebase)

| Hạng mục | Dùng gì | Nguồn |
|---|---|---|
| HTTP client | `ref.watch(dioProvider)`, repo nhận `Dio` qua constructor | `core/network/dio_client.dart` |
| Unwrap response | helper kiểu `_dataMap` / `_items` (lấy `body['data']`, `data['items']`) | `features/mentorship/.../mentorship_repository.dart` |
| Lỗi | `ErrorInterceptor` bọc thành `ApiException` (có `.message`, `.statusCode`, `.isForbidden`…) | `core/errors/api_exception.dart` |
| State | Riverpod: `StateProvider` cho query + `FutureProvider`/`.family` cho list (pattern `mentorQueryProvider` + `mentorListProvider`) | mentorship providers |
| Current user id | `ref.watch(authStateProvider).valueOrNull?.user?.id` (String) | `features/auth/.../auth_provider.dart` |
| Màu | `AppColors.primary/secondary/surface/divider/textSecondary/warning/error` | `core/theme/app_colors.dart` |
| Ảnh | `resolveImageUrl(raw)` + `CachedNetworkImageProvider` | `core/utils/image_url.dart` |
| Điều hướng | go_router `context.push(...)` | `core/router/route_names.dart` |
| Loading/Error/Empty | `LoadingView`, `ErrorView` (+ `RefreshIndicator` cho pull-to-refresh) | `lib/shared/widgets/` |
| Card style | `Container` bo góc 12, `border: AppColors.divider`, avatar `CircleAvatar` | `mentor_card.dart`, `community_section.dart` |
| Format ngày | cần helper mới (vd `core/utils/date_format.dart`) dùng `intl` `DateFormat('dd/MM/yyyy HH:mm')` — codebase **chưa có** helper sẵn | `intl: ^0.19.0` đã trong `pubspec.yaml` |
