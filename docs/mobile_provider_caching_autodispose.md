# Mobile (Flutter) — Cơ chế cache dữ liệu & chiến lược `autoDispose`

> Ngày tạo: 2026-07-02
> Phạm vi: `mobile_flutter/` (Flutter + Riverpod + Dio).
> Bối cảnh: rà soát cách app cache dữ liệu từ API và quyết định "mỗi lần vào trang thì
> load lại API" cho các provider phù hợp.

---

## 1. Hiện trạng — app cache dữ liệu ở đâu?

Có **2 tầng**, và điểm mấu chốt là **cache thực sự nằm ở tầng Riverpod**, không phải HTTP.

### 1.1. Tầng HTTP (Dio) — KHÔNG cache

`core/network/dio_client.dart` chỉ gắn 3 interceptor: `AuthInterceptor`, `ErrorInterceptor`,
`CookieManager`. **Không có** cache-interceptor (không dùng `dio_cache_interceptor` hay tương tự).

- `cached_network_image` (trong `pubspec.yaml`) **chỉ cache ảnh**, không cache JSON.
- → Mỗi lần thực sự phát request là gọi thẳng server, không có bộ nhớ đệm phản hồi HTTP.

### 1.2. Tầng Riverpod — cache trong RAM cho tới khi invalidate/dispose

Mặc định `FutureProvider` / `AsyncNotifierProvider` **giữ kết quả trong bộ nhớ suốt vòng đời app**
sau lần tính đầu tiên. Với `FutureProvider.family`, mỗi tham số (vd `id`) là một bản cache riêng.

Kết quả chỉ được nạp lại khi:
- `ref.invalidate(...)` / `ref.refresh(...)` (đang dùng ở nút **Retry** của `ErrorView` và ở
  pull-to-refresh `RefreshIndicator`), **hoặc**
- provider bị `autoDispose` huỷ khi không còn listener, **hoặc**
- restart app.

**Hệ quả trước khi sửa:** mở chi tiết quỹ id=5 → gọi API; rời trang rồi vào lại id=5 →
**hiển thị dữ liệu cũ trong RAM, KHÔNG gọi lại API**. Toàn codebase trước đó chỉ dùng `autoDispose`
đúng 2 chỗ (chat recent previews, event interaction), còn lại đều giữ cache như trên.

---

## 2. `autoDispose` — cơ chế "load lại mỗi lần vào"

Thêm `.autoDispose` vào provider: khi rời trang (không còn widget nào lắng nghe) → provider bị huỷ;
lần sau vào lại → tự fetch mới.

Lưu ý vòng đời với điều hướng `push` (go_router):
- Từ trang A `push` sang trang con B → A **vẫn trong stack, vẫn còn listener** → provider của A
  **không** bị huỷ (không reload thừa khi quay lại B→A).
- Chỉ khi `pop` trang A (rời hẳn) → không còn listener → huỷ → vào lại A sẽ fetch mới.

→ Đúng nghĩa "mỗi lần **bấm vào từ danh sách** thì load lại".

---

## 3. Đã áp dụng — feature Fundraising

File: `features/fundraising/presentation/providers/fundraising_provider.dart`

| Provider | Trước | Sau | Lý do |
|---|---|---|---|
| `fundDetailProvider` | `FutureProvider.family` | `FutureProvider.autoDispose.family` | Mở lại chi tiết quỹ luôn gọi API mới, không hiện dữ liệu cũ. |
| `fundsProvider` | `FutureProvider` | `FutureProvider.autoDispose` | Vào lại danh sách quỹ luôn refetch. State lọc/tìm kiếm nằm ở `fundQueryProvider` (KHÔNG autoDispose) nên **được giữ nguyên**. |
| `myDonationsProvider` | `FutureProvider` | `FutureProvider.autoDispose` | Lịch sử đóng góp refetch mỗi lần vào (vd sau khi vừa quyên góp). |

Tất cả usage (`watch`, `invalidate`, `read(...future)`, `RefreshIndicator`) đều tương thích với
`autoDispose` — không phải sửa gì thêm. `flutter analyze lib/features/fundraising/`: **No issues found**.

> **Nút Retry vẫn giữ nguyên:** khi load lỗi, `ErrorView` (nhãn `common.retry` = "Thử lại") gọi
> `ref.invalidate(...)` để fetch lại. Không đổi.

---

## 4. Xem xét feature Chat — KHÁC fund, phải cẩn thận (có WebSocket)

Chat realtime qua WebSocket nên câu chuyện cache khác hẳn danh sách REST. Chia 3 nhóm:

| Provider | Loại | autoDispose hiện tại | Kết luận |
|---|---|---|---|
| `chatSocketServiceProvider` | `Provider` (kết nối WS dùng chung) | Không | ⛔ **TUYỆT ĐỐI KHÔNG** autoDispose — 1 socket dùng chung toàn app, phải sống xuyên suốt điều hướng (chỉ huỷ khi tear-down container, vd logout). Hiện đúng. |
| `chatListProvider` | `FutureProvider` (list hội thoại, REST) | ✅ **Đã áp** | Giống `fundsProvider`, không tự update từ socket nên trước đây bị cache cũ. Search text ở `chatListQueryProvider` (giữ nguyên). |
| `recentPreviewsProvider` | `FutureProvider` (REST) | ✅ **Đã áp** | Refetch mỗi lần mở panel preview. |
| `groupBlockedContextProvider` | `FutureProvider.family` (REST) | ✅ **Đã áp** | Refetch banner mỗi lần mở phòng. |
| `chatGroupMembersProvider` | `AsyncNotifierProvider.family` | Không | 🟡 Áp được, rủi ro thấp (đã có mutation `invalidateSelf`). |
| `chatRecentPreviewsProvider` (trong `chat_group_provider.dart`) | `FutureProvider.autoDispose` | **Đã có** | ⚠️ **Trùng** với `recentPreviewsProvider` — tồn tại 2 provider recent-preview. Đáng dọn nhưng ngoài phạm vi lần này. |
| `chatMessagesProvider` | `AsyncNotifierProvider.family` (tin nhắn 1 phòng) | Không | ⚠️ **Chỗ đặc biệt — xem 4.1** |

### 4.1. `chatMessagesProvider` — điểm quan trọng nhất

File: `features/chat/presentation/providers/chat_messages_provider.dart`

Provider này **không giống** các list REST:
- `build(groupId)`: connect socket → `joinGroup(groupId)` → subscribe events → load lịch sử REST.
- `ref.onDispose()`: `_sub.cancel()` + `_socket.leaveGroup(groupId)`.
- Tin nhắn mới **tự cập nhật realtime** qua `_onEvent` khi đang trong phòng.

Hai hệ quả:

1. **"Load lại mỗi lần vào" gần như không cần** cho provider này — vì khi đang trong phòng, socket
   đã giữ dữ liệu luôn tươi. Vấn đề "cache cũ" không tồn tại như list REST.

2. **Điểm đáng chú ý (có thể là thiếu sót sẵn có):** vì **không** `autoDispose`, khi rời phòng chat
   provider **không bị huỷ** → `leaveGroup` + `cancel sub` trong `onDispose` **không bao giờ chạy**
   trong lúc dùng app. Tức **mọi phòng từng mở đều ở trạng thái "joined" + còn subscribe** cho tới khi
   thoát app. Code viết `onDispose` rõ ràng **có ý** dọn theo vòng đời từng phòng → chỉ hoạt động đúng
   nếu là `autoDispose`.

   → `chatMessagesProvider` **nên** `autoDispose`, nhưng **lý do là dọn tài nguyên / vòng đời socket
   đúng**, KHÔNG phải để "reload". Vì đụng lifecycle realtime nên cần **quyết định có chủ đích** +
   test kỹ (điều hướng nhanh vào/ra phòng, reconnect, không mất tin).

---

## 5. Đề xuất & trạng thái

| Nhóm | Provider | Đề xuất | Trạng thái |
|---|---|---|---|
| Fund | `fundDetailProvider`, `fundsProvider`, `myDonationsProvider` | autoDispose | ✅ **Đã làm** |
| Chat — REST an toàn | `chatListProvider`, `recentPreviewsProvider`, `groupBlockedContextProvider` | autoDispose (giống fund) | ✅ **Đã làm** |
| Chat — rủi ro thấp | `chatGroupMembersProvider` | autoDispose | ⏳ Chưa làm (không nằm trong đợt này) |
| Chat — realtime | `chatMessagesProvider` | autoDispose (vì lifecycle socket, cần test kỹ) | ⏳ Chưa làm (quyết định riêng) |
| Chat — không đụng | `chatSocketServiceProvider` | **Giữ nguyên** | — |
| Dọn dẹp (tuỳ chọn) | trùng `recentPreviewsProvider` vs `chatRecentPreviewsProvider` | Gộp/loại 1 | Ngoài phạm vi |

---

## 6. Rủi ro & lưu ý chung khi dùng `autoDispose`

- **Giữ state lọc/tìm kiếm ở provider riêng** (vd `fundQueryProvider`, `chatListQueryProvider` là
  `StateProvider`, KHÔNG autoDispose) → autoDispose list vẫn không mất filter.
- **Không autoDispose provider hạ tầng dùng chung** (socket, service kết nối) — sẽ gây
  connect/disconnect churn.
- Với provider realtime (`AsyncNotifier` + socket), autoDispose thay đổi **vòng đời join/leave** →
  phải test điều hướng nhanh, mất/lặp tin, reconnect.
- `push` sang trang con **không** huỷ provider trang cha (vẫn còn listener). Nếu cần "luôn fresh kể cả
  khi quay lại từ trang con" thì phải `invalidate` chủ động trong `initState` (nặng tay hơn, thường
  không cần).
