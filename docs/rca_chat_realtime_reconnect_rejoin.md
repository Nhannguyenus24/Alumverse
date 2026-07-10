# RCA — Tin nhắn chat (video) không hiện realtime khi upload lâu, phải reload mới thấy

> Ngày tạo: 2026-07-10
> Phạm vi: `frontend/` (React — WebSocket chat), `backend/` (Spring WebFlux — `ChatWebSocketHandler`).
> Bối cảnh: trên **production**, khi gửi tin nhắn có **video** mà upload lâu (~10-15s), tin nhắn
> **không hiện realtime** (kể cả với chính người gửi); phải **reload trang** (fetch lại REST) mới thấy.
> Khi upload nhanh thì tin hiện realtime bình thường. **Local không tái hiện.**
>
> Trạng thái: **đã xác định nguyên nhân gốc (confirmed bằng DevTools)** · **đã triển khai phương án fix client-side
> (mục 6: re-JOIN khi reconnect + resync REST khi reconnect)** — xem **mục 9** để biết chi tiết implementation.
> (Hướng nâng cấp bền vững hơn — broadcast theo membership — ghi lại ở mục 6.5, chưa chọn.)

---

## 1. Tóm tắt (TL;DR)

- Chat dùng **raw WebSocket** tự viết (không STOMP/SockJS). Upload file và gửi tin là **2 round-trip tách biệt**:
  1. Client base64-encode file → **REST** `POST /api/files/upload` (video/gif) hoặc `/api/images/upload` → nhận URL.
  2. Upload xong mới gửi frame `SEND_MESSAGE` qua **WebSocket**.
- Backend chỉ broadcast `MESSAGE_CREATED` tới các session **đã gửi `JOIN_GROUP`** (map `groupToSessions` in-memory).
- **Bug:** khi WebSocket rớt & tự reconnect trong lúc upload nặng, client **KHÔNG gửi lại `JOIN_GROUP`**
  trên connection mới → session mới không nằm trong `groupToSessions[groupId]` → broadcast rơi vào hư không.
  UI người gửi **không** render optimistic, chỉ hiện tin khi nhận echo `MESSAGE_CREATED` → nên **không thấy gì**
  cho tới khi reload (reload = fetch lại REST `/messages`, tin đã lưu DB nên hiện ra).
- **Nguyên nhân gốc là ở reconnect handling, KHÔNG phải ở upload.** Upload nặng chỉ là **tác nhân kích hoạt**
  hay gặp nhất (làm nghẽn uplink → rớt socket). Bất kỳ lần rớt nào (sleep máy, đổi wifi, blip mạng) đều gây bug.

---

## 2. Kiến trúc luồng gửi tin có media

```
[Browser]                                  [nginx]                [Backend WebFlux]
   │                                           │                          │
   │ 1. POST /api/files/upload (base64 JSON)   │                          │
   │────────────────────────────────────────► │ /api/ (proxy_read 120s)  │
   │        (video 21MB → ~28MB base64,        │─────────────────────────►│ FileUploadController
   │         chiếm uplink ~10-15s)             │                          │  → trả URL
   │◄───────────────────────────────────────  │◄─────────────────────────│
   │                                           │                          │
   │ 2. WebSocket SEND_MESSAGE {content:url}   │                          │
   │═══════════════════════════════════════►  │ /ws/ (proxy_read 3600s)  │ ChatWebSocketHandler
   │                                           │═════════════════════════►│  → lưu DB
   │                                           │                          │  → broadcastMessage()
   │◄═══ MESSAGE_CREATED (echo cho mọi         │◄═════════════════════════│     tới groupToSessions[groupId]
   │      session ĐÃ JOIN group này) ══════════│                          │
```

Điểm cốt lõi: **upload (REST) và gửi tin (WS) độc lập.** Việc upload lâu không trực tiếp làm hỏng gì —
cái bị ảnh hưởng là **connection WebSocket** đang "rảnh" trong lúc uplink bị upload chiếm.

---

## 3. Vị trí code liên quan

### Frontend
- `frontend/src/components/network/NetworkChatPanel.jsx`
  - `handleFileSelected` (≈242-283): base64 → `chatApi.uploadChatMedia/Image` → **rồi mới** `wsSendMessage(...)`.
  - `handleWsEvent` (113-127): **chỉ** render tin khi nhận `MESSAGE_CREATED`. **Không có optimistic append** →
    người gửi phụ thuộc hoàn toàn vào echo từ socket.
  - Effect join group (139-149): **chỉ phụ thuộc `[activeChat?.id]`** → chỉ join khi **đổi phòng**,
    KHÔNG join lại khi **socket reconnect**. ⭐ đây là mắt xích hỏng.
- `frontend/src/hooks/mentorship/useChatWebSocket.js`
  - `ws.onopen` (97-101): khi (re)connect thành công **chỉ gọi `flushOutbox()`** — **không** re-send `JOIN_GROUP`. ⭐
  - `ws.onclose` (116-126): reconnect có backoff (1s→15s), nhưng chỉ dựng lại socket, không khôi phục "đang ở phòng nào".
  - `outboxRef`: chỉ queue các frame gửi **trong lúc** đang disconnect; không giúp re-join phòng đã join trước khi rớt.
- `frontend/src/hooks/chat/useChatMessages.js`: fetch REST `/messages` **1 lần mỗi khi đổi `groupId`** — không refetch khi reconnect.
- `frontend/src/utils/axios.js` (18-21): `apiClient` **không set `timeout`** (axios mặc định = 0 = vô hạn) → loại trừ lỗi timeout phía client.
- `frontend/.env`: `VITE_WS_CHAT_URL=wss://alumni-api-hcmus.duckdns.org/ws/chat` — WS nối **thẳng** tới backend.
- `frontend/vercel.json`: REST `/api/*` đi qua **Vercel rewrite** tới duckdns. → prod có **2 đường mạng khác nhau** cho REST vs WS.

### Backend
- `backend/src/main/java/com/service/backend/chat/websocket/ChatWebSocketHandler.java`
  - `groupToSessions: Map<Long, Set<WebSocketSession>>` (44): **in-memory**, mỗi connection là 1 `WebSocketSession` mới.
  - `handleJoinGroup` (153-175): **nơi DUY NHẤT** thêm session vào `groupToSessions`.
  - `handleSendMessage` (177-195): lưu DB **không** cần session phải nằm trong group set (tự re-check membership qua `chatService`).
  - `broadcastMessage` (211-245): `sessions = groupToSessions.get(groupId)`; nếu `null`/rỗng → `Mono.empty()` (bỏ qua im lặng);
    gửi echo cho **mọi** session trong set, **kể cả người gửi** (không loại trừ sender).
  - `cleanupSession` (259-265): chạy ở `doFinally` khi disconnect → gỡ session khỏi mọi group.
  - **Không** có server-side ping/heartbeat; không có idle-timeout cấu hình.

### Hạ tầng
- `nginx.prod.conf`: `/ws/` `proxy_read_timeout 3600s`, `proxy_buffering off` (không cắt vì idle);
  `/api/` `proxy_read_timeout 120s`; `client_max_body_size 50M`. → **không** phải nguyên nhân (xem mục 5).

---

## 4. Chuỗi suy luận loại trừ (vì sao chắc chắn đúng)

Dữ kiện quan sát trên prod (từ curl + DevTools):
1. Upload video 21MB thành công (~10-15s), backend trả URL.
2. Trên WebSocket **có** gửi frame `SEND_MESSAGE` (thấy trong DevTools).
3. **Không** có `MESSAGE_CREATED` bắn về; reload thì tin hiện ra → **tin ĐÃ lưu DB thành công**.

Suy luận:
- Tin lưu được DB ⇒ backend đã **nhận và xử lý** `SEND_MESSAGE` ⇒ connection lúc gửi **đang sống** ở server.
- `broadcastMessage` gửi echo cho **mọi** session trong `groupToSessions[groupId]`, **gồm cả người gửi**.
  Người gửi không nhận echo ⇒ session-lúc-gửi **không nằm trong** `groupToSessions[groupId]`.
- Một session "sống ở server nhưng không nằm trong group set" chỉ xảy ra khi nó **chưa từng gửi `JOIN_GROUP`**
  trên connection đó (vì `LEAVE_GROUP` chỉ khi đổi phòng — không xảy ra; `cleanupSession` chỉ khi disconnect —
  thì đã không thể là session gửi tin).
- Tin/text upload nhanh **vẫn** realtime ⇒ `JOIN_GROUP` **đã từng hoạt động** ⇒ cơ chế duy nhất khiến session-lúc-gửi
  chưa join là: **socket cũ rớt → reconnect tạo connection mới → connection mới không được re-join.**

⇒ **Kết luận duy nhất nhất quán:** reconnect trong lúc upload, thiếu re-JOIN_GROUP.

### Bằng chứng đóng đinh (DevTools → Network → WS)
Quan sát thực tế: **4 kết nối WebSocket**.
- Socket **#1**: có `JOIN_GROUP` + `JOINED_GROUP` → tin gửi trên nó **có** `MESSAGE_CREATED` phản hồi.
- Socket **#2, #3, #4** (reconnect trong lúc upload): **không** có `JOIN_GROUP`/`JOINED_GROUP` → **không** có `MESSAGE_CREATED`.

Việc một connection chỉ có đúng frame `SEND_MESSAGE` mà thiếu hẳn `JOINED_GROUP` chính là **chữ ký**
của "connection vừa reconnect, chưa join".

---

## 5. Vì sao chỉ xảy ra ở prod & gắn với upload nặng (không phải nginx timeout)

- **Local:** WS chạy qua `ws://localhost:8080` (loopback), không nghẽn băng thông thật → socket gần như không bao giờ rớt
  → bug (vốn có sẵn) không lộ.
- **Prod:** REST đi qua Vercel edge → duckdns; WS nối **thẳng** duckdns. Upload 28MB base64 làm **bão hoà uplink** ~10-15s,
  đúng điều kiện khiến WebSocket đang rảnh bị rớt ở tầng network (mất gói, middlebox, TCP timeout khi uplink đầy).
- **Không phải lỗi nginx timeout:** `/ws/` để `3600s` nên không bị cắt vì idle; nếu là timeout `/api/` (120s) khi upload
  thì sẽ **fail hẳn upload** (504/abort, hiện toast lỗi) chứ không phải "reload mới thấy".
- **Không phải axios timeout:** `apiClient` không set `timeout`.
- **PING/PONG heartbeat KHÔNG sửa được bug này:** socket rớt vì **nghẽn uplink**, không phải idle → PING cũng không chen qua
  được lúc nghẽn. Và dù giữ được kết nối tốt hơn, chỉ cần rớt **1 lần** vì lý do bất kỳ là lại mất tin nếu chưa có re-join.
  Heartbeat là "nice to have" bổ trợ, **không thay thế** fix re-join.

---

## 6. Hướng khắc phục — Phương án đã chốt

> **Quyết định (2026-07-10):** chọn phương án **client-side**, **giữ nguyên mô hình subscription** hiện tại:
> **(1) Frontend re-JOIN khi reconnect** + **(B) Frontend resync REST khi reconnect**.
> Backend **gần như không đổi** → **KHÔNG** phải sửa `handleWsEvent`.
>
> **Lý do KHÔNG chọn (A) broadcast-theo-membership:** tuy bền vững cấu trúc hơn (xoá **hẳn** lớp bug "quên re-join"),
> nhưng nó buộc backend đẩy tin cho **mọi phòng** member thuộc về → **bắt buộc** đổi `handleWsEvent` để route theo
> `groupId` (append vs unread) — **thay đổi này không mong muốn** ở thời điểm hiện tại. (A) vẫn được ghi lại **đầy đủ**
> ở **mục 6.5** làm hướng nâng cấp tương lai.

### Vì sao "triệt để = (1) + (B)"

- **(1)** sửa **routing sau reconnect**: socket mới luôn được re-JOIN → broadcast tới đúng nó → dứt **triệu chứng đã báo**
  (tin mình gửi sau khi nối lại không hiện).
- **(B)** đóng **khe hở vật lý**: **luôn tồn tại** khoảng thời gian client **offline hoàn toàn** (giữa lúc rớt và lúc nối lại);
  tin **người khác gửi trong khoảng đó** không thể push xuống → chỉ **resync khi nối lại** mới lấy về được.
- Thiếu (B) thì **không** triệt để: (1) một mình vẫn để mất tin của người khác gửi đúng lúc mạng mình rớt.

| Thành phần | Vai trò | Trạng thái |
|---|---|---|
| **(1)** Re-JOIN khi reconnect (client) | Sửa routing sau reconnect — dứt triệu chứng đã báo | ✅ **Đã triển khai** (mục 9.1) |
| **(B)** Resync REST khi reconnect (client) | ⭐ Đóng khe hở tin bị lỡ lúc client offline hoàn toàn | ✅ **Đã triển khai** (mục 9.2) |
| (C) Upload multipart | Giảm ~33% payload → giảm **tần suất** rớt socket (không đóng khe hở) | Tùy chọn |
| (D) PING/PONG heartbeat | Dọn connection zombie, phát hiện chết nhanh hơn | Tùy chọn |
| (A) Broadcast theo membership | Xoá **hẳn** lớp bug "quên re-join" (bền vững cấu trúc) — nhưng phải đổi `handleWsEvent` | Không chọn (mục 6.5) |
| (E) Redis pub/sub | Chỉ cần khi backend scale > 1 instance | Trực giao |

---

### 6.1 (1) — [ĐÃ TRIỂN KHAI] Frontend re-JOIN khi reconnect

`useChatWebSocket.js`: track các `groupId` đã join (Set/ref); trong `ws.onopen`, **sau khi** set `status="open"`,
tự động gửi lại `JOIN_GROUP` cho **tất cả** group đã join trước khi rớt (bên cạnh `flushOutbox()` như hiện tại).
`joinGroup`/`leaveGroup` cập nhật Set này.

- Fix **cause-agnostic**: socket rớt vì lý do gì (upload nặng, sleep máy, đổi wifi, blip mạng) cũng tự phục hồi.
- **Giữ nguyên mô hình subscription:** backend vẫn chỉ broadcast cho session đã JOIN phòng đang mở → **không** phải
  đổi `handleWsEvent`, không phát sinh tin của phòng khác. Đây chính là lý do chọn (1) thay vì (A).
- ⚠️ Đánh đổi: **vẫn giữ invariant "client phải nhớ re-JOIN"** (khác (A) là xoá hẳn invariant này). Chấp nhận để giữ
  backend & `handleWsEvent` nguyên trạng.

**Thay đổi code (`useChatWebSocket.js`):**
```js
const joinedGroupsRef = useRef(new Set());     // các groupId đang tham gia

// joinGroup: nhớ lại + gửi
const joinGroup = useCallback((groupId) => {
  if (groupId == null) return false;
  joinedGroupsRef.current.add(Number(groupId));
  return sendJson({ type: "JOIN_GROUP", groupId: Number(groupId) });
}, [sendJson]);

// leaveGroup: quên đi + gửi
const leaveGroup = useCallback((groupId) => {
  if (groupId == null) return false;
  joinedGroupsRef.current.delete(Number(groupId));
  return sendJson({ type: "LEAVE_GROUP", groupId: Number(groupId) });
}, [sendJson]);

// trong ws.onopen — SAU flushOutbox(), re-join mọi phòng đã tham gia:
ws.onopen = () => {
  reconnectAttemptRef.current = 0;
  setStatus("open");
  flushOutbox();
  joinedGroupsRef.current.forEach((gid) =>
    ws.send(JSON.stringify({ type: "JOIN_GROUP", groupId: gid })));
};
```

> Tham chiếu: bản **mobile Flutter đã làm đúng cách này** —
> `mobile_flutter/lib/features/chat/realtime/chat_socket_service.dart` track `_joinedGroups` + gọi `_rejoinAndFlush()`
> mỗi lần socket (re)open; yêu cầu này cũng có trong `docs/plan_mobile_chat_feature.md`. Web chỉ cần mirror lại.

### 6.2 (B) — [ĐÃ TRIỂN KHAI] Frontend resync REST khi reconnect

**Vì sao vẫn cần dù đã có (1):** (1) chỉ khôi phục **routing** cho socket mới → cứu tin **mình gửi sau khi nối lại**.
Còn tin **người khác gửi trong lúc socket mình đang rớt hoàn toàn** thì lúc đó mình **không có kết nối** để nhận →
vẫn mất tới khi reload. Đây là khe hở **vật lý**, (1) không giải quyết được.

**Cách làm — `useChatWebSocket.js` + `NetworkChatPanel.jsx`:**
- Phát hiện transition `status`: `closed/error → open` (tức vừa reconnect, không phải lần connect đầu tiên).
- Khi đó, cho group đang mở, gọi lại REST `chatApi.getMessages(groupId, 0, PAGE_SIZE)` (backend chỉ hỗ trợ
  `page`/`size`, **không có** filter since-id) — lấy **trang mới nhất** (dùng chung `PAGE_SIZE = 10` với lần tải
  ban đầu) rồi merge với `messages` hiện có bằng `Map` khoá theo `id` (**dedupe**), sort lại theo `id` tăng dần
  để đảm bảo đúng thứ tự.
  ⚠️ Nếu số tin bị lỡ trong lúc offline hoàn toàn vượt quá `PAGE_SIZE` (10), phần cũ hơn sẽ không tự kéo về — chỉ
  hiện khi user tự "load more" hoặc reload. Chấp nhận đánh đổi này để giữ đúng chủ trương "backend không đổi";
  nếu cần chính xác tuyệt đối, hướng nâng cấp sau là thêm param `sinceId` ở `ChatController.getMessages`.
- Expose thêm callback `onReconnect` từ `useChatWebSocket` (bắn khi socket mở lại sau lần open đầu tiên) để
  `NetworkChatPanel` trigger `resyncMessages()` từ `useChatMessages`.

> Lưu ý: `useChatMessages.js` hiện chỉ fetch **1 lần mỗi khi đổi `groupId`** — cần thêm đường refetch chủ động
> khi reconnect (không đổi `groupId`).

### 6.3 (C) — [TÙY CHỌN] Upload multipart/form-data thay base64 JSON

Payload nhỏ hơn ~33% (21MB thay vì ~28MB base64) → uplink nghẽn ngắn hơn → **giảm tần suất** rớt socket.
Chỉ là giảm nhẹ tác nhân kích hoạt, **không** đóng khe hở → không thay thế (B).

### 6.4 (D) — [TÙY CHỌN] PING/PONG heartbeat

Client gửi ping định kỳ; không có pong → chủ động close+reconnect. Dọn connection zombie & phát hiện chết nhanh hơn.
Bổ trợ, không thay thế (1)/(B). Lưu ý: socket rớt do **nghẽn uplink** (không phải idle) thì PING cũng không chen qua
được → heartbeat không cứu được ca upload nặng.

### 6.5 (A) — [KHÔNG CHỌN — hướng nâng cấp tương lai] Backend broadcast theo membership

> **Không triển khai lúc này.** Ghi lại đầy đủ để tham khảo khi cần cải tổ (vd làm unread-badge realtime toàn app).
> Lý do chưa chọn: buộc đổi `handleWsEvent` (route theo `groupId`) — thay đổi không mong muốn hiện tại (xem cuối mục).

**Mô hình hiện tại (subscription — mong manh):** backend chỉ gửi tin cho session **đã chủ động `JOIN_GROUP`**
(map `groupToSessions`). Đây là **invariant mong manh**: "client phải luôn nhớ re-JOIN mỗi lần socket mở lại".
Chỉ cần một đường reconnect quên là tin rơi vào hư không — chính là bug này. Phương án (1) **vá** invariant này;
phương án (A) **xoá hẳn** nó.

**Mô hình mới (membership-based — bền vững):** đối tượng nhận tin **suy ra từ 2 nguồn bền vững**, không phụ thuộc
trạng thái app-level do client tự khai báo:
1. **Ai là thành viên group** → query DB `chatGroupMemberRepository.findByGroupId(groupId)` (dữ liệu bền).
2. **Thành viên đó đang có socket nào mở** → map `memberId → sessions`, cập nhật ở **tầng CONNECT/DISCONNECT**
   (luôn tự chạy lại mỗi lần reconnect), **không** ở tầng `JOIN_GROUP`.

**Thay đổi code — `chat/websocket/ChatWebSocketHandler.java`:**

```java
// Thay groupToSessions bằng index thuận theo member:
Map<String, Long> sessionToMember;                  // (giữ nguyên) sessionId → memberId
Map<Long, Set<WebSocketSession>> memberToSessions;   // MỚI: memberId → sessions

// handle() — chạy MỖI lần connect (kể cả reconnect):  (≈ dòng 78-79)
sessionToMember.put(session.getId(), memberId);
memberToSessions.computeIfAbsent(memberId, k -> ConcurrentHashMap.newKeySet()).add(session);

// cleanupSession() — khi disconnect:  (≈ dòng 259-265)
sessionToMember.remove(session.getId());
var s = memberToSessions.get(memberId);
if (s != null) { s.remove(session); if (s.isEmpty()) memberToSessions.remove(memberId); }

// broadcastMessage() — tra thành viên group rồi đẩy tới session đang mở:  (≈ dòng 211-245)
private Mono<Void> broadcastMessage(Long groupId, ChatMessage msg, UserDisplayInfo sender) {
    String eventJson = ...; // build payload y như cũ (id, groupId, senderMemberId, content, ...)
    return chatGroupMemberRepository.findByGroupId(groupId)          // ai trong group
        .flatMap(m -> {
            var sessions = memberToSessions.get(m.getMemberId());    // họ đang mở socket nào
            if (sessions == null) return Mono.empty();
            return Flux.fromIterable(sessions)
                .filter(WebSocketSession::isOpen)
                .flatMap(sess -> sess.send(Mono.just(sess.textMessage(eventJson))))
                .then();
        })
        .then();
}
```

**Vì sao xoá cả lớp bug "quên re-join":** `memberToSessions` được set/xoá ngay trong `handle()` — mà `handle()`
**luôn chạy cho mọi connection mới**, kể cả socket reconnect. Client **không cần làm gì thêm** sau reconnect;
chỉ cần kết nối lại (đã tự động) là backend biết ngay member đó online ở socket nào. Không còn trạng thái
subscription app-level nào để "mất đồng bộ".

**`JOIN_GROUP`/`handleJoinGroup`:** không còn cần cho việc **gửi tin** → có thể **bỏ hẳn**, hoặc **giữ làm no-op**
để tương thích ngược (nếu sau này dùng cho presence/typing).

**⛔ Thay đổi client kèm theo — đây là lý do CHƯA chọn (A) (`NetworkChatPanel.jsx`):** vì giờ backend đẩy tin cho
**mọi phòng** member đó thuộc về (không chỉ phòng đang mở), `handleWsEvent` (113-127) **bắt buộc phải route theo `groupId`**:
- Nếu `payload.groupId === activeChat.id` → append vào phòng đang mở (như hiện tại).
- Nếu khác → cập nhật **unread badge / danh sách hội thoại**, KHÔNG append nhầm vào phòng đang xem.

> Nếu sau này muốn **unread-badge / danh sách hội thoại tự cập nhật realtime cho mọi phòng**, thì thay đổi này lại trở
> thành **tính năng mong muốn** — khi đó nâng cấp lên (A) là hợp lý.

**Đánh đổi khác:** thêm 1 query DB (`findByGroupId`) mỗi lần broadcast (hiện broadcast là in-memory thuần). Giảm nhẹ:
query đã được index & rẻ; có thể cache `group → members` trong RAM và invalidate khi đổi thành viên. Lưu ý
`chatService.sendMessage` (và `handleJoinGroup` cũ) vốn **đã** query membership nên chi phí không hoàn toàn mới.

### 6.6 (E) — [TRỰC GIAO] Multi-instance cần Redis pub/sub

Cả mô hình subscription hiện tại lẫn (A) đều dùng map in-memory → **chỉ đúng khi backend chạy 1 instance** (prod hiện tại
`upstream 127.0.0.1:8080` → ok). Nếu scale ngang N instance, session ở instance A không nằm trong map instance B →
cần **pub/sub (Redis)** fan-out sự kiện `MESSAGE_CREATED` giữa các instance. Là hạn chế **trực giao** với bug này,
ghi nhận để làm khi cần scale.

---

## 7. Cách tái hiện & xác minh

**Tái hiện (prod):** vào 1 phòng chat → gửi 1 video ~20MB (upload ~10-15s) → tin không hiện, reload mới thấy.

**Xác minh nguyên nhân (DevTools → Network → lọc `WS`):**
- Thấy **nhiều** connection ws: connection đầu có `JOIN_GROUP`/`JOINED_GROUP`; các connection sau (reconnect) **thiếu** chúng.
- Connection gửi `SEND_MESSAGE` mà không kèm `JOINED_GROUP` → không có `MESSAGE_CREATED` trả về.

**Xác minh sau khi fix (phương án đã chọn (1)+(B)):**
- **(1)** Sau mỗi lần reconnect, connection mới **luôn** có `JOIN_GROUP` → `JOINED_GROUP` ngay khi mở (kiểm tra DevTools →
  Network → WS). Gửi video/tin trên socket vừa reconnect vẫn nhận lại `MESSAGE_CREATED` → hiện realtime.
- **(B)** Ngắt mạng vài giây trong lúc người khác gửi tin → khi mạng nối lại, danh sách tin **tự đồng bộ** đủ các tin
  bị lỡ (không cần reload), không trùng lặp (dedupe theo `id`).

---

## 8. Tham chiếu

- `docs/plan_chat_media_attachments.md` — plan gửi ảnh/video (ghi rõ `useChatWebSocket.js` "không cần sửa" cho feature
  attachment → gap reconnect có sẵn từ trước, độc lập với attachment).
- `docs/plan_mobile_chat_feature.md` — yêu cầu reconnect + re-JOIN_GROUP + outbox flush (mobile đã làm đúng).
- `nginx.prod.conf`, `nginx.conf` — cấu hình proxy `/ws/` vs `/api/`.
