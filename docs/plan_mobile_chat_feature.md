# Plan: Hoàn thiện tính năng Chat (Tin nhắn) trên Mobile (Flutter)

> Mục tiêu: port đầy đủ tính năng **Chat ("Tin nhắn")** từ `frontend/` (React) sang
> `mobile_flutter/` (Flutter + Riverpod + Dio + go_router + web_socket_channel), để mobile
> đạt ngang tính năng với web.
>
> Tham chiếu mobile: [plan_mobile_network_feature.md](./plan_mobile_network_feature.md)
> (chat là bước nối tiếp của network — card "Nhắn tin" / "Kết nối" điều hướng sang `/chat`).
>
> Tham chiếu web (code thực tế đã đọc):
> `pages/chat/ChatPage.jsx`, `components/network/NetworkChatSidebar.jsx`,
> `components/network/NetworkChatPanel.jsx`, `hooks/chat/*`, `hooks/mentorship/useChatWebSocket.js`,
> `components/network/GroupMembersDrawer.jsx`, `components/CreateGroupChatDialog.jsx`.

---

## 1. Hiện trạng — Gap Analysis

### Web frontend có gì

| # | Sub-feature | Vị trí web | API / Transport chính |
|---|---|---|---|
| 1 | **Danh sách hội thoại** (sidebar gộp group + private) | `ChatPage.jsx` / `NetworkChatSidebar.jsx` | `GET /chat/groups`, `GET /chat/private/list` |
| 2 | **Khung chat + lịch sử tin nhắn** (infinite scroll lên) | `NetworkChatPanel.jsx` / `useChatMessages.js` | `GET /chat/groups/{groupId}/messages?page&size` |
| 3 | **Gửi/nhận realtime** | `useChatWebSocket.js` | WebSocket `/ws/chat?token=` (JSON: `JOIN_GROUP` / `SEND_MESSAGE` / `LEAVE_GROUP` → `MESSAGE_CREATED`) |
| 4 | **Tạo group chat** | `CreateGroupChatDialog.jsx` / `useCreateGroupChat.js` | `POST /chat/groups` |
| 5 | **Quản lý thành viên group** (xem / thêm / xóa / rời) | `GroupMembersDrawer.jsx`, `AddGroupMemberDialog.jsx` | `GET/POST /chat/groups/{id}/members`, `DELETE …/members/{memberId}`, `DELETE …/leave` |
| 6 | **Chặn / Bỏ chặn trong chat** + banner blocked | `NetworkChatPanel.jsx`, `useBlockUser.js` | `POST/DELETE/GET /chat/blocks/{id}`, `GET /chat/groups/{id}/blocked-members-context` |
| 7 | **Recent previews** (dropdown tin nhắn gần đây trên navbar) | `MessagesPreviewPanel.jsx` / `useRecentChatPreviews.js` | `GET /chat/recent-previews` |
| 8 | **Emoji picker** trong ô soạn | `ChatEmojiPickerButton.jsx` | (client-side) |

### Mobile hiện có gì

| File | Nội dung |
|---|---|
| `features/chat/presentation/pages/chat_list_page.dart` | **Placeholder** — chỉ `AppBar('Tin nhắn')` + text "Chat sắp ra mắt" |
| `features/chat/.gitkeep` | Thư mục feature còn rỗng (chưa có `data/`) |
| `core/network/websocket_client.dart` | **ĐÃ CÓ** `WebSocketClient` (connect/send/disconnect, stream broadcast). Chưa ai dùng. |
| `core/constants/api_endpoints.dart` | **Đã có:** `chatGroups`, `chatPrivateList`, `chatGroupMessages(id)`, `chatRecentPreviews`, `wsChat = '/ws/chat'`. **Thiếu:** members / blocked-context / leave / group-info / private-create / block-context endpoints (xem Mục 3). |
| `core/config/env.dart` | **ĐÃ CÓ** `Env.wsBaseUrl` (`ws://10.0.2.2:8080`) + `apiBaseUrl`. |
| `core/router/app_router.dart` | Route `/chat` → **`ChatListPage`** (placeholder). |
| `pubspec.yaml` | `web_socket_channel: ^3.0.1` đã có. **Chưa có** package emoji picker. |

### Kết luận: **CHƯA hoàn thành.** Mức độ ~5% (chỉ có placeholder + sẵn `WebSocketClient` & vài endpoint)

| # | Sub-feature | Trạng thái mobile |
|---|---|---|
| 1 | Danh sách hội thoại | ❌ **Thiếu hoàn toàn** (endpoint group/private đã có, chưa dùng) |
| 2 | Khung chat + lịch sử | ❌ **Thiếu** (endpoint messages đã có) |
| 3 | Realtime WebSocket | ⚠️ **Hạ tầng có** (`WebSocketClient`) — **chưa có** protocol layer / provider / reconnect |
| 4 | Tạo group chat | ❌ **Thiếu** (cả endpoint POST helper) |
| 5 | Quản lý thành viên group | ❌ **Thiếu** (cả endpoints) |
| 6 | Chặn / banner blocked | ⚠️ Block/unblock dùng chung repo từ **feature network** (đã/đang làm) — chat chỉ cần **banner + blocked-context endpoint** |
| 7 | Recent previews | ❌ **Thiếu** (endpoint đã có) |
| 8 | Emoji picker | ❌ **Thiếu** (cần thêm package hoặc tự làm grid đơn giản) |

> Backend **đã hỗ trợ đầy đủ** mọi endpoint + WebSocket. Đây thuần là công việc
> **client-side trên mobile**, không cần thay đổi backend.

---

## 2. Kiến trúc đề xuất (theo convention `features/network` + `features/mentorship`)

```
lib/features/chat/
├── data/
│   ├── models/
│   │   ├── chat_conversation.dart        # MỚI — item sidebar (gộp group + private đã normalize)
│   │   ├── chat_message.dart             # MỚI — tin nhắn (khớp ChatMessageResponse + MESSAGE_CREATED payload)
│   │   ├── chat_group_member.dart        # MỚI — thành viên group (memberId, fullName, avatarUrl, role, joinedAt)
│   │   ├── group_blocked_context.dart    # MỚI — blockedMembers[] + currentUserRole
│   │   └── chat_recent_preview.dart      # MỚI — item recent previews
│   ├── datasources/
│   │   └── chat_api.dart                 # MỚI — bọc REST (giống user_api.dart, có _unwrap)
│   └── repositories/
│       └── chat_repository.dart          # MỚI — list/messages/create/members/leave/blocked-context/recent
├── realtime/
│   ├── chat_socket_messages.dart         # MỚI — model in/out của WS (JOIN_GROUP/SEND_MESSAGE/MESSAGE_CREATED…)
│   └── chat_socket_service.dart          # MỚI — bọc WebSocketClient: connect+token, encode/decode JSON, reconnect, outbox
├── presentation/
│   ├── providers/
│   │   ├── chat_list_provider.dart       # MỚI — query state + FutureProvider danh sách hội thoại (gộp + sort)
│   │   ├── chat_messages_provider.dart   # MỚI — AsyncNotifier.family<List<ChatMessage>, groupId> (history + realtime + pagination)
│   │   ├── chat_socket_provider.dart      # MỚI — Provider giữ ChatSocketService + StreamProvider sự kiện
│   │   └── chat_group_provider.dart       # MỚI — members / blocked-context / create / add / remove / leave
│   ├── pages/
│   │   ├── chat_list_page.dart           # SỬA — thay placeholder bằng danh sách hội thoại thật
│   │   ├── chat_room_page.dart           # MỚI — màn hội thoại (messages + composer)
│   │   ├── create_group_page.dart        # MỚI — tạo group (thay cho dialog web)
│   │   └── group_members_page.dart       # MỚI — quản lý thành viên (thay drawer web)
│   └── widgets/
│       ├── conversation_tile.dart        # MỚI — 1 dòng trong danh sách hội thoại
│       ├── message_bubble.dart           # MỚI — bong bóng tin (trái/phải, tên, avatar, giờ)
│       ├── chat_composer.dart            # MỚI — ô soạn multiline + nút gửi + emoji
│       ├── chat_blocked_banner.dart      # MỚI — banner blocked (private + group blocked-context)
│       └── emoji_picker_sheet.dart       # MỚI — bottom sheet chọn emoji
```

**Quyết định nền tảng (khác web do form factor mobile):**

| Web | Mobile | Lý do |
|---|---|---|
| 2 cột (sidebar + panel) trên 1 trang | **2 màn riêng**: `chat_list_page` → `chat_room_page` (push route) | Màn hình hẹp; điều hướng push tự nhiên hơn split-view |
| `CreateGroupChatDialog` (modal) | `create_group_page` (full page) hoặc `showModalBottomSheet` | Chọn nhiều thành viên + search cần nhiều không gian |
| `GroupMembersDrawer` (drawer phải) | `group_members_page` (push) hoặc bottom sheet | Không có drawer phải trên mobile |
| Emoji picker popover | `emoji_picker_sheet` (bottom sheet) | — |

---

## 3. API endpoints cần thêm

### `core/constants/api_endpoints.dart` — bổ sung

```dart
// --- Chat (bổ sung) ---
// chatGroups (POST tạo group) dùng lại hằng đã có: '/api/chat/groups'
static String chatGroupMembers(int groupId) => '/api/chat/groups/$groupId/members';       // GET list / POST add
static String chatGroupMember(int groupId, int memberId) => '/api/chat/groups/$groupId/members/$memberId'; // DELETE remove
static String chatGroupLeave(int groupId) => '/api/chat/groups/$groupId/leave';            // DELETE
static String chatGroupBlockedContext(int groupId) => '/api/chat/groups/$groupId/blocked-members-context'; // GET
static String chatGroupInfo(int groupId) => '/api/chat/groups/$groupId/info';              // GET metadata (tùy chọn)
// Private chat (nếu mở chat trực tiếp từ network không qua conversation-request)
static const String chatPrivateCreate = '/api/chat/private/create';                        // POST { targetMemberId }
static const String chatPrivateInfo = '/api/chat/private';                                  // GET ?targetMemberId
```

> **Lưu ý prefix:** endpoint mobile **có** prefix `/api` (vd `/api/chat/...`), khác web
> (`/chat/...`). Bám theo các hằng đã có trong `api_endpoints.dart`.

> Block/unblock (`blocks`, `blockUser(id)`) **đã có** trong `api_endpoints.dart` và được dùng
> chung với feature network — chat **không** khai báo lại, chỉ tái dùng repository tương ứng.

### Bảng hợp đồng API (REST)

| Sub-feature | Method + Path | Query / Body | Response (trong `data`) |
|---|---|---|---|
| 1 Group list | `GET /api/chat/groups` | `text, page, size` (size=5) | `{ items[], totalPage, totalItem }` |
| 1 Private list | `GET /api/chat/private/list` | `text, page, size` (size=5) | `{ items[], totalPage, totalItem }` |
| 2 Messages | `GET /api/chat/groups/{groupId}/messages` | `page, size` (size=20, **DESC** newest-first) | `List<ChatMessageResponse>` |
| 4 Create group | `POST /api/chat/groups` | `{ title?, memberIds: [] }` (2–9 người + creator, tối đa 10) | `ChatGroup` (201) |
| 5 Members list | `GET /api/chat/groups/{groupId}/members` | `text, page, size` (size=50) | `{ items[], totalPage, totalItem }` |
| 5 Add members | `POST /api/chat/groups/{groupId}/members` | `{ memberIds: [] }` (owner) | `Void` |
| 5 Remove member | `DELETE /api/chat/groups/{groupId}/members/{memberId}` | — (owner) | `Void` |
| 5 Leave group | `DELETE /api/chat/groups/{groupId}/leave` | — | `Void` |
| 6 Blocked context | `GET /api/chat/groups/{groupId}/blocked-members-context` | — | `{ blockedMembers[], currentUserRole }` |
| 6 Block status | `GET /api/chat/blocks/{targetMemberId}` | — | `{ targetMemberId, blocked }` |
| 6 Block / Unblock | `POST` / `DELETE /api/chat/blocks/{targetMemberId}` | — | block obj / confirm |
| 7 Recent previews | `GET /api/chat/recent-previews` | — | `List<RecentChatPreviewResponse>` |

> **Lưu ý parse:** `page` API là **0-based**. Wrapper pagination chat dùng **số ít**
> `totalPage`/`totalItem` (giống network) — **đừng** tái dùng `PaginatedResponse` shared
> (`totalPages`/`totalElements`). Messages trả về **List trực tiếp** (không bọc pagination).

---

## 4. WebSocket — realtime layer (trọng tâm của chat)

### 4.1 Kết nối

- **URL:** `${Env.wsBaseUrl}${ApiEndpoints.wsChat}?token=<JWT>` → `ws://10.0.2.2:8080/ws/chat?token=…`.
- **Token:** đọc từ `secureStorageProvider.readAccessToken()` (giống `AuthInterceptor`), **encode** vào query (`Uri.encodeComponent`).
- **Auth khác REST:** WS truyền token qua **query param**, không qua header `Authorization`.
- Dùng lại `core/network/websocket_client.dart` đã có; **bọc thêm** `ChatSocketService` để xử lý JSON + reconnect + outbox (WebSocketClient hiện chỉ raw).

### 4.2 Protocol (JSON) — port từ `useChatWebSocket.js`

**Client → Server**

```jsonc
{ "type": "JOIN_GROUP",  "groupId": 123 }
{ "type": "LEAVE_GROUP", "groupId": 123 }
{ "type": "SEND_MESSAGE", "groupId": 123, "content": "Hello",
  "chatType": "PRIVATE" | "GROUP", "messageType": "TEXT", "metadata": null }
```

**Server → Client**

```jsonc
{ "type": "MESSAGE_CREATED", "payload": {
    "id": 999, "groupId": 123, "senderMemberId": 456,
    "senderFullName": "…", "senderAvatarUrl": "…",
    "content": "Hello", "messageType": "TEXT", "metadata": null,
    "createdAt": "2026-06-20T10:30:00" } }
{ "type": "JOINED_GROUP", "groupId": 123, "message": "…" }
{ "type": "LEFT_GROUP",   "groupId": 123, "message": "…" }
{ "type": "ERROR", "message": "…" }
```

### 4.3 `ChatSocketService` — yêu cầu

- `connect()` 1 lần khi vào màn chat (hoặc khi app foreground + đã login); giữ 1 kết nối dùng chung cho mọi room.
- **Reconnect** exponential backoff: `1s, 2s, 4s, 8s, 15s (max)` (đúng như web).
- **Outbox queue:** tin gửi khi đang `closed`/`connecting` → enqueue, flush khi `open`.
- Khi reconnect xong → **re-`JOIN_GROUP`** lại room đang mở.
- Expose `Stream<ChatSocketEvent>` (đã decode) + `status` (`connecting|open|closed|error`).
- `dispose()` khi logout / app tắt.
- **Token hết hạn:** nếu WS đóng do 401-like → thử đọc token mới (có thể đã được refresh bởi REST `AuthInterceptor`) trước khi reconnect. *(MVP: chỉ reconnect; refresh chủ động để Mục 8.)*

### 4.4 Tích hợp với state

- `chat_socket_provider.dart`: `Provider<ChatSocketService>` (giữ singleton) + `StreamProvider` phát `ChatSocketEvent`.
- `chat_messages_provider.dart` (`AsyncNotifier.family` theo `groupId`):
  - `build`: gọi REST history (page 0, size 20, **đảo lại** thành ASC để render top→bottom), gửi `JOIN_GROUP`.
  - Lắng nghe socket stream → khi `MESSAGE_CREATED` đúng `groupId` → **append** vào state (tránh trùng theo `id`; xử lý optimistic echo nếu có).
  - `loadOlder()`: REST page kế tiếp, **prepend** (infinite scroll lên — web threshold 8px từ đỉnh).
  - `send(content)`: gửi `SEND_MESSAGE` qua service; **không** tự append (chờ `MESSAGE_CREATED` broadcast — web cũng vậy). Cân nhắc optimistic + reconcile để mượt hơn (tùy chọn, Mục 8).
  - `dispose`: gửi `LEAVE_GROUP`.

---

## 5. Kế hoạch theo từng Sub-feature

### Sub-feature 1 — Danh sách hội thoại (sidebar → `chat_list_page`)

- **Model:** `ChatConversation` normalize từ 2 nguồn:
  - group item: `{ id, type=GROUP, title→name, memberCount, lastMessagePreview→preview, lastMessageAt }`
  - private item: `{ id, type=PRIVATE, peerFullName→name, peerAvatarUrl→avatarUrl, peerMemberId, blockedByMe, blockedByPeer, lastMessagePreview→preview, lastMessageAt }`
- **Repository:** `listGroups({text,page,size})`, `listPrivate({text,page,size})`.
- **Provider:** `chat_list_provider` — fetch **cả 2**, **gộp & sort theo `lastMessageAt` desc** (đúng web), giữ search query + pagination state.
- **UI:** `ConversationTile` (avatar via `resolveImageUrl` + `CachedNetworkImageProvider`, tên, preview, giờ). Search bar (Enter để apply). Pull-to-refresh. Tap → push `chat_room_page(groupId, …)`.
- **Empty state:** "Chưa có hội thoại nào".
- **Nút tạo group:** AppBar action → `create_group_page`.

### Sub-feature 2 + 3 — Khung chat + lịch sử + realtime (`chat_room_page`)

- **Model:** `ChatMessage` (`id, groupId, senderMemberId, senderFullName?, senderAvatarUrl?, content, messageType, metadata?, createdAt`).
- **UI:**
  - `ListView` **reverse: true** (mới nhất ở đáy) — phù hợp infinite-scroll lên + auto-stick đáy.
  - `MessageBubble`: tin của mình phải/`AppColors.primary`, người khác trái/xám; hiện tên + avatar (group), giờ `HH:mm`.
  - "Đang tải tin cũ…" khi `loadOlder`; "Đã tải hết tin nhắn" ở đỉnh; empty "Chưa có tin nhắn".
  - Xác định **"tin của mình"**: so `senderMemberId` với current user id (`ref.watch(authStateProvider).valueOrNull?.user?.id` — **String**, nhớ parse/so khớp kiểu).
- **Composer:** `chat_composer` — `TextField` multiline (max ~4 dòng), nút emoji (mở `emoji_picker_sheet`), nút gửi (disable khi rỗng / socket `closed` / bị block). Enter-to-send tùy chọn (mobile thường dùng nút gửi).
- **Realtime:** theo Mục 4.3.

### Sub-feature 4 — Tạo group chat (`create_group_page`) — Phase 2

- **UI:** ô tiêu đề (tùy chọn), search liên hệ (tái dùng **connections** từ network: `GET /api/chat/connections/search`), chọn nhiều (chips), min 2 / max 9 người ngoài creator (tổng ≤ 10).
- **Repository:** `createGroup({title?, memberIds})` → `POST /api/chat/groups`.
- Sau tạo: invalidate danh sách hội thoại + push thẳng vào `chat_room_page` của group mới.

> **Phụ thuộc network:** danh sách liên hệ để tạo group dùng endpoint connections của feature
> network. Nếu network chưa xong, có thể tạm dùng `network/members` (directory). **Chốt khi triển khai.**

### Sub-feature 5 — Quản lý thành viên group (`group_members_page`) — Phase 2

- **Model:** `ChatGroupMember` (`memberId, fullName, avatarUrl, role OWNER|MEMBER, joinedAt`).
- **Repository:** `listMembers(groupId,…)`, `addMembers(groupId, memberIds)`, `removeMember(groupId, memberId)`, `leaveGroup(groupId)`.
- **UI:** list thành viên (badge Owner/Member, "(Bạn)" cho chính mình). Owner: thêm (nếu tổng < 10) / xóa member; mọi người: **Rời nhóm** (dialog xác nhận). Khi owner rời → BE tự chuyển quyền cho người vào sớm nhất / xóa nhóm nếu còn 1 mình.
- Sau add/remove/leave: invalidate members + danh sách hội thoại. Leave → pop về `chat_list_page`.

### Sub-feature 6 — Chặn / Banner blocked

- **Tái dùng** block/unblock repo từ feature **network** (không viết lại transport).
- **Private chat banner** (đọc từ `ChatConversation`):
  - `blockedByMe == true` → "Bạn đã chặn {tên}" + nút **Bỏ chặn**, composer disable.
  - `blockedByPeer == true` → "Bạn không thể nhắn cho {tên}", composer disable.
- **Group banner:** gọi `GET …/blocked-members-context` → nếu có blockedMembers, hiện banner liệt kê + (owner) gợi ý xử lý. **Không** chặn gửi tin trong group (BE vẫn cho gửi).
- Sau block/unblock: invalidate blocked-context + danh sách hội thoại private.

### Sub-feature 7 — Recent previews — Phase 2

- **Model:** `ChatRecentPreview` (`id, name, avatarUrl?, preview, updatedAt, type`).
- **Repository:** `recentPreviews()` → `GET /api/chat/recent-previews`.
- **UI:** trên web là dropdown navbar. ✅ **Chốt:** Phase 2 — gắn vào **Home** (section "Tin nhắn gần đây") / badge trên icon chat.

### Sub-feature 8 — Emoji picker (Phase 2)

- ✅ **Chốt:** thêm package **`emoji_picker_flutter`** → bọc trong `emoji_picker_sheet` (bottom sheet),
  chèn emoji vào `chat_composer` tại vị trí con trỏ.
- Thêm dependency vào `pubspec.yaml` (kiểm tra version tương thích Flutter/Dart hiện tại của repo).
- **MVP:** composer **chưa render nút emoji**; bật khi build Phase 2.

---

## 6. Routing & điều hướng

`core/router/app_router.dart`:

```dart
// Giữ route '/chat' → ChatListPage (đã có), nhưng ChatListPage giờ là màn thật.
GoRoute(path: RouteNames.chat, builder: (_, __) => const ChatListPage()),
```

Thêm route phòng chat + phụ trợ (đề xuất dùng route con để deep-link được từ network/notification):

```dart
// '/chat/:groupId' → ChatRoomPage
GoRoute(
  path: '${RouteNames.chat}/:groupId',
  builder: (_, state) => ChatRoomPage(
    groupId: int.tryParse(state.pathParameters['groupId'] ?? '') ?? 0,
    // tên/loại có thể truyền qua extra hoặc fetch /info
  ),
),
```

- `create_group_page`, `group_members_page` *(Phase 2)*: route con (`/chat/new`, `/chat/:groupId/members`) **đặt đúng thứ tự** để `:groupId` không nuốt `new` (khai báo `/chat/new` **trước** `/chat/:groupId`), hoặc dùng `context.push` với widget trực tiếp.
- ✅ **Chốt — điều hướng từ feature network** (card "Nhắn tin" khi ACCEPTED):
  `context.push('/chat/$chatGroupId')` **nếu** connection có `chatGroupId`; ngược lại fallback `context.push('/chat')`.
  → `ConnectionSearchItemResponse` đã có field `chatGroupId` (xem plan network), nên thường có id để mở thẳng phòng.

---

## 7. Checklist file

### Tạo mới — `features/chat/`

**MVP (Sub-feature 1, 2, 3, 6):**

- [ ] `data/models/chat_conversation.dart`
- [ ] `data/models/chat_message.dart`
- [ ] `data/models/group_blocked_context.dart`
- [ ] `data/datasources/chat_api.dart`
- [ ] `data/repositories/chat_repository.dart`
- [ ] `realtime/chat_socket_messages.dart`
- [ ] `realtime/chat_socket_service.dart`
- [ ] `presentation/providers/chat_list_provider.dart`
- [ ] `presentation/providers/chat_messages_provider.dart`
- [ ] `presentation/providers/chat_socket_provider.dart`
- [ ] `presentation/pages/chat_room_page.dart`
- [ ] `presentation/widgets/conversation_tile.dart`
- [ ] `presentation/widgets/message_bubble.dart`
- [ ] `presentation/widgets/chat_composer.dart` *(MVP: chưa có nút emoji)*
- [ ] `presentation/widgets/chat_blocked_banner.dart`

**Phase 2 (Sub-feature 4, 5, 7, 8):**

- [ ] `data/models/chat_group_member.dart` *(SF5)*
- [ ] `data/models/chat_recent_preview.dart` *(SF7)*
- [ ] `presentation/providers/chat_group_provider.dart` *(SF4, 5)*
- [ ] `presentation/pages/create_group_page.dart` *(SF4)*
- [ ] `presentation/pages/group_members_page.dart` *(SF5)*
- [ ] `presentation/widgets/emoji_picker_sheet.dart` *(SF8)*

### Sửa

**MVP:**

- [ ] `features/chat/presentation/pages/chat_list_page.dart` — thay placeholder bằng danh sách hội thoại thật
- [ ] `core/constants/api_endpoints.dart` — thêm `chatGroupBlockedContext`, `chatPrivateCreate/Info` (members/leave để Phase 2)
- [ ] `core/router/app_router.dart` — thêm route `/chat/:groupId`

**Phase 2:**

- [ ] `core/constants/api_endpoints.dart` — thêm `chatGroupMembers/Member/Leave/Info`
- [ ] `core/router/app_router.dart` — thêm `/chat/new`, `/chat/:groupId/members`
- [ ] `pubspec.yaml` — thêm `emoji_picker_flutter`

> **Tái dùng (không tạo mới):** `core/network/websocket_client.dart`, block/unblock repo của
> feature network, `secureStorageProvider`, `dioProvider`, `LoadingView`/`ErrorView`,
> `resolveImageUrl`, `AppColors`.

---

## 8. Thứ tự triển khai (gợi ý)

### MVP (Sub-feature 1, 2, 3, 6)

1. `api_endpoints.dart` (thêm `chatGroupBlockedContext`, `chatPrivateCreate/Info`) + models (`chat_message`, `chat_conversation`, `group_blocked_context`).
2. `chat_api.dart` + `chat_repository.dart` (list groups/private, messages, blocked-context).
3. **Realtime layer**: `chat_socket_messages` + `chat_socket_service` (connect+token, decode, reconnect, outbox) + `chat_socket_provider`. Test connect/nhận `MESSAGE_CREATED` bằng 1 room thật.
4. `chat_list_provider` + `chat_list_page` (gộp + sort + search + tile). Thay placeholder.
5. `chat_messages_provider` (history + realtime + loadOlder) + `chat_room_page` + `message_bubble` + `chat_composer`. Route `/chat/:groupId`.
6. Banner blocked (private flags + group blocked-context); tái dùng block/unblock repo của network.
7. Nối điều hướng từ network: `/chat/$chatGroupId` (else `/chat`). Test thủ công theo Mục 10.

### Phase 2 (Sub-feature 4, 5, 7, 8)

8. Endpoints members/leave/info + `chat_group_provider`; tạo group (`create_group_page`) + quản lý thành viên (`group_members_page`).
9. Emoji (`emoji_picker_flutter` + `emoji_picker_sheet`, bật nút trong composer).
10. Recent previews (Home / badge icon chat).

---

## 9. Các điểm đã chốt (20/06/2026)

| # | Vấn đề | Quyết định |
|---|---|---|
| 1 | **Phạm vi MVP** | ✅ **MVP = Sub-feature 1, 2, 3, 6** (danh sách hội thoại + phòng chat + realtime + banner blocked). **Phase 2:** tạo group (4), quản lý thành viên (5), recent previews (7), emoji (8). |
| 2 | Emoji: package hay grid tĩnh | ✅ **Thêm package** `emoji_picker_flutter`. *(Thuộc Phase 2 — đi cùng khi build Sub-feature 8.)* |
| 3 | Recent previews đặt ở đâu | ✅ **Phase 2**, gắn Home / badge icon chat. |
| 4 | Optimistic send | ✅ **Theo web** (không optimistic) ở MVP; thêm sau nếu thấy trễ. |
| 5 | Nguồn liên hệ khi tạo group | ✅ `connections/search` (network). *(Thuộc Phase 2 cùng Sub-feature 4.)* |
| 6 | Điều hướng từ network "Nhắn tin" (ACCEPTED) | ✅ **`/chat/$chatGroupId` nếu có `chatGroupId`, ngược lại `/chat`**. |
| 7 | Refresh token cho WS khi 401 | ✅ MVP **chỉ reconnect**; refresh chủ động + reconnect để Phase 2. |
| 8 | 1 kết nối WS dùng chung vs mỗi room | ✅ **1 kết nối dùng chung** (giống web), join/leave theo room. |

> **Tóm tắt phạm vi build session này (MVP):** Sub-feature **1, 2, 3, 6**.
> Composer (Sub-feature 2) ở MVP **chưa có nút emoji** (emoji = Phase 2); các nút disable
> theo trạng thái socket/block vẫn áp dụng.

---

## 10. Test plan (thủ công)

- [ ] Danh sách hội thoại: gộp group + private, sort theo tin mới nhất, search theo tên, pull-to-refresh.
- [ ] Mở 1 hội thoại: load 20 tin mới nhất, cuộn lên load tin cũ, "đã tải hết" ở đỉnh.
- [ ] Realtime: gửi từ web → mobile nhận `MESSAGE_CREATED` tức thì; gửi từ mobile → web nhận.
- [ ] Reconnect: tắt/bật mạng → tự reconnect + re-join room + outbox flush tin gửi khi offline.
- [ ] Tin của mình bên phải, người khác bên trái; group hiện tên+avatar người gửi; giờ `HH:mm`.
- [ ] Tạo group: chọn 2–9 người, tạo xong vào thẳng room.
- [ ] Thành viên: owner thêm/xóa; member rời nhóm (dialog); owner rời → chuyển quyền / xóa nhóm.
- [ ] Block: private bị/đang chặn → banner + composer disable; group có blocked → banner.
- [ ] Composer: multiline, nút gửi disable khi rỗng/disconnected, emoji chèn được.
- [ ] Điều hướng từ network card "Nhắn tin" → vào đúng hội thoại.

---

## 11. Ngoài phạm vi (Out of scope)

- **Read receipts** (đã đọc), **typing indicator**, **online presence** — backend & web **chưa** hỗ trợ.
- **Đính kèm ảnh/file** — `messageType IMAGE/FILE/VIDEO` + `metadata` BE có schema nhưng web **chưa dùng**; để sau.
- **Sửa/xóa/thu hồi tin** (BE có `editedAt`/`deletedAt` nhưng web không expose), **reactions**, **forward**, **pin**, **search trong hội thoại**.
- **Push notification** tin nhắn mới khi app background (cân nhắc Phase sau, cần FCM).
- **Unread count** chính xác (BE chưa có endpoint đếm chưa đọc).

---

## 12. Phụ lục — Field reference & WS protocol

> Tên field chính xác để viết `fromJson`. `page` API **0-based**; wrapper `ApiResponse` → unwrap
> `res.data['data']`; pagination chat dùng **số ít** `totalPage`/`totalItem`.

| Model | Nguồn | Field |
|---|---|---|
| **ChatMessage** | `groups/{id}/messages` (REST) **+** `MESSAGE_CREATED.payload` (WS) | `id, groupId, senderMemberId, senderFullName?, senderAvatarUrl?, content, messageType, metadata?, createdAt` (+ `editedAt?, deletedAt?` — bỏ qua tin `deletedAt != null`) |
| **Group list item** | `chat/groups` | `id, type=GROUP, title, createdBy, createdAt, updatedAt, memberCount, lastMessagePreview, lastMessageAt` |
| **Private list item** | `chat/private/list` | `id, type=PRIVATE, title, createdBy, createdAt, updatedAt, peerMemberId, peerFullName, peerAvatarUrl, lastMessagePreview, lastMessageAt, blockedByMe, blockedByPeer` |
| **ChatGroupMember** | `groups/{id}/members` | `memberId, fullName, avatarUrl, role (OWNER\|MEMBER), joinedAt` |
| **GroupBlockedContext** | `groups/{id}/blocked-members-context` | `blockedMembers[] { memberId, fullName, avatarUrl }, currentUserRole (OWNER\|MEMBER\|null)` |
| **ChatRecentPreview** | `recent-previews` | `id, name, avatarUrl?, preview, updatedAt, type (PRIVATE\|GROUP)` |

**WS — Client → Server**

| type | payload |
|---|---|
| `JOIN_GROUP` | `{ groupId }` |
| `LEAVE_GROUP` | `{ groupId }` |
| `SEND_MESSAGE` | `{ groupId, content, chatType: PRIVATE\|GROUP, messageType: "TEXT", metadata: null }` |

**WS — Server → Client**

| type | payload |
|---|---|
| `MESSAGE_CREATED` | `{ payload: ChatMessage }` → append vào room đúng `groupId` |
| `JOINED_GROUP` / `LEFT_GROUP` | `{ groupId, message }` |
| `ERROR` | `{ message }` → SnackBar / log |

**Enums (khớp BE):**
- `ChatType`: `PRIVATE`, `GROUP`
- `ChatRole`: `OWNER`, `MEMBER`
- `ChatMessageType`: `TEXT`, `IMAGE`, `FILE`, `SYSTEM`, `VIDEO` (MVP chỉ `TEXT`)

---

## 13. Phụ lục — Convention mobile cần bám (giống plan network)

| Hạng mục | Dùng gì | Nguồn |
|---|---|---|
| HTTP client | `ref.watch(dioProvider)`, repo nhận `Dio` qua constructor | `core/network/dio_client.dart` |
| WebSocket | `WebSocketClient` + bọc `ChatSocketService`; URL `Env.wsBaseUrl + wsChat + ?token=` | `core/network/websocket_client.dart`, `core/config/env.dart` |
| Token | `secureStorageProvider.readAccessToken()` (header REST đã do `AuthInterceptor`; WS qua query) | `core/network/auth_interceptor.dart` |
| Unwrap response | helper `_unwrap` / `_dataMap` / `_items` (lấy `body['data']` → `items`) | `features/user/.../user_api.dart`, mentorship repo |
| Lỗi | `ErrorInterceptor` → `ApiException` (`.message`, `.statusCode`, `.isForbidden`) | `core/errors/api_exception.dart` |
| State | Riverpod: `StateProvider` (query) + `FutureProvider`/`.family` (list) + `AsyncNotifier.family` (room realtime) | network/mentorship providers |
| Current user id | `ref.watch(authStateProvider).valueOrNull?.user?.id` (**String** — nhớ so kiểu với `senderMemberId` int) | `features/auth/.../auth_provider.dart` |
| Màu | `AppColors.primary/secondary/surface/divider/textSecondary/warning/error` | `core/theme/app_colors.dart` |
| Ảnh | `resolveImageUrl(raw)` + `CachedNetworkImageProvider` | `core/utils/image_url.dart` |
| Điều hướng | go_router `context.push(...)` | `core/router/route_names.dart` |
| Loading/Error/Empty | `LoadingView`, `ErrorView` (+ `RefreshIndicator`) | `lib/shared/widgets/` |
| Format ngày/giờ | `intl` `DateFormat('HH:mm')` / `'dd/MM/yyyy HH:mm'` (helper chung — codebase **chưa có**, có thể tạo `core/utils/date_format.dart`) | `intl: ^0.19.0` đã có |
</content>
</invoke>
