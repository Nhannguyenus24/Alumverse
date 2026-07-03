# Plan: Gửi tin nhắn Ảnh / Video trong Chat (Frontend + Mobile)

> Mục tiêu: cho phép người dùng **gửi ảnh và video** trong khung chat trên cả
> `frontend/` (React) và `mobile_flutter/` (Flutter), có **giới hạn dung lượng file**
> và **giới hạn loại file (extension)** — vài định dạng phổ biến.
>
> Tham chiếu: [plan_mobile_chat_feature.md](./plan_mobile_chat_feature.md) — tính năng chat
> nền tảng (danh sách hội thoại, phòng chat, realtime WebSocket, block). Plan này **nối tiếp**,
> đúng mục "Đính kèm ảnh/file" đang **Out of scope** ở plan đó (Mục 11).
>
> Code thực tế đã đọc:
> - BE: `chat/websocket/ChatWebSocketHandler.java`, `chat/service/ChatService.java`,
>   `shared/enums/ChatMessageType.java`, `shared/service/ImageService.java`,
>   `shared/service/FileUploadService.java`, `shared/controller/{ImageController,FileUploadController}.java`,
>   `application.properties`, `application-prod.properties`, `docs/postgre.sql` (`chat_messages`).
> - Web: `components/network/NetworkChatPanel.jsx`, `hooks/mentorship/useChatWebSocket.js`,
>   `hooks/chat/useChatMessages.js`, `utils/imageUtils.js`, `utils/api.js`.
> - Mobile: `features/chat/realtime/chat_socket_service.dart` + `chat_socket_messages.dart`,
>   `features/chat/presentation/providers/chat_messages_provider.dart`,
>   `features/chat/presentation/widgets/{chat_composer,message_bubble}.dart`,
>   `features/user/.../my_profile_edit_page.dart` + `user_api.dart` (pattern upload ảnh),
>   `core/constants/api_endpoints.dart`.
> - Hạ tầng: `nginx.conf`, `nginx.prod.conf`.

---

## 1. Hiện trạng — Gap Analysis

### Đã có sẵn (không cần làm lại)

| Tầng | Đã hỗ trợ | Vị trí |
|---|---|---|
| **DB schema** | Cột `content` (comment: "an url"), `message_type` (default `TEXT`), `metadata` JSONB — **thiết kế sẵn cho đính kèm** | `docs/postgre.sql` `chat_messages` (~L538) |
| **Enum loại tin** | `TEXT, IMAGE, FILE, SYSTEM, VIDEO` | `shared/enums/ChatMessageType.java` |
| **Pipeline gửi (BE)** | `ChatWebSocketHandler.handleSendMessage` đọc `messageType` + `metadata`, gọi `ChatService.sendMessage(...)`, insert `jsonb`, rồi **broadcast `MESSAGE_CREATED` kèm `messageType` + `metadata`** | `chat/websocket/ChatWebSocketHandler.java` (~L166, broadcast ~L200) |
| **WS client (web)** | `sendMessage({groupId, content, chatType, messageType="TEXT", metadata=null})` — **đã nhận `messageType`/`metadata`**, UI chỉ chưa set | `hooks/mentorship/useChatWebSocket.js` (~L167) |
| **WS client (mobile)** | `ChatSocketOutbound.sendMessage` **đã nhận** `messageType` + `Map metadata` | `features/chat/realtime/chat_socket_messages.dart` (~L47) |
| **Upload ảnh (BE)** | `POST /api/images/upload` `{ base64String }` → decode → **convert WebP** → ghi `UUID.webp` → trả URL string trong `ApiResponse.data`. **Không** có size cap ở service. | `shared/controller/ImageController.java`, `shared/service/ImageService.java` |
| **Upload file (BE)** | `POST /api/files/upload` `{ base64String, fileName }` → ghi raw bytes `UUID.ext` → trả URL. Có `MAX_BYTES=10MB`, `ALLOWED_EXTENSIONS={pdf,doc,docx,png,jpg,jpeg}` | `shared/controller/FileUploadController.java`, `shared/service/FileUploadService.java` (~L34–35) |
| **Upload ảnh (client)** | Web: `utils/imageUtils.js` (`fileToBase64`, `validateImageFile`). Mobile: `image_picker` (đã có trong `pubspec.yaml`) + pattern base64 ở `my_profile_edit_page.dart`, transport `user_api.dart:uploadImage` | — |

### Còn thiếu (phạm vi plan này)

| # | Việc | Tầng |
|---|---|---|
| 1 | UI chọn ảnh/video (nút đính kèm trong composer) | Web + Mobile |
| 2 | Validate **extension** + **dung lượng** trước khi upload | Web + Mobile |
| 3 | Upload lấy URL rồi gửi WS với `messageType=IMAGE\|VIDEO` + `metadata` | Web + Mobile |
| 4 | **Render hiển thị thẳng** ảnh (`<img>`) và video (`<video controls>`) | Web + Mobile |
| 5 | **Nới trần** dung lượng + **bật loại file** (video/gif/webp) | Backend + nginx |

---

## 2. Quyết định thiết kế đã chốt

| Vấn đề | Chốt |
|---|---|
| **Kiến trúc upload** | **Giữ base64-in-JSON, nâng trần** (không làm multipart streaming ở giai đoạn này) |
| **Loại video (4)** | `mp4, mov, webm, m4v`. ⚠️ Không phát được mọi nơi (webm ✗ iOS/Safari; mov ✗ Firefox) → **fallback nút "Tải về"** khi platform không phát được. `mp4` an toàn nhất. |
| **Loại ảnh (5)** | `jpg, jpeg, png, webp, gif` — `gif` lưu **raw** để giữ ảnh động |
| **Trần dung lượng** | Ảnh **10 MB**, Video **30 MB** |
| **Render** | **Hiển thị thẳng inline** (không thumbnail→lightbox / trang phát riêng) |
| **Video mobile** | **Poster + bấm để phát** (khởi tạo player khi tap) — tránh lag khi cuộn danh sách nhiều video |
| **Luồng gửi** | **Gửi ngay sau khi chọn** — 1 file / 1 tin, không kèm caption (MVP) |
| **Metadata** | **Tối thiểu**: `fileName, size, mimeType` (bỏ qua width/height/durationMs ở MVP) |

> ⚠️ **Rủi ro đã cân nhắc & chấp nhận:** base64-in-JSON **buffer toàn bộ file trong RAM**
> (~40MB/request cho video 30MB). Trên **mobile**, base64 một file 30MB tạo chuỗi ~40MB
> trong RAM → chấp nhận được. Xem biện pháp giảm thiểu ở **Mục 7**; nếu về sau upload lớn
> gây bất ổn, cân nhắc chuyển sang **multipart streaming**.

### 2.1 Bảng giới hạn (chốt)

| Nhóm | Extension | Trần (raw) | base64 (~+33%) | Endpoint | MIME |
|---|---|---|---|---|---|
| Ảnh tĩnh | `jpg, jpeg, png, webp` | **10 MB** | ~13 MB | `POST /api/images/upload` (Scrimage→WebP) | `image/jpeg`,`image/png`,`image/webp` |
| Ảnh động | `gif` | **10 MB** | ~13 MB | `POST /api/files/upload` (raw) | `image/gif` |
| Video | `mp4, mov, webm, m4v` | **30 MB** | ~40 MB | `POST /api/files/upload` (raw) | `video/mp4`,`video/quicktime`,`video/webm`,`video/x-m4v` |

- **Gif tách endpoint** vì `ImageService` chạy Scrimage→WebP sẽ **mất animation** (chỉ frame đầu) → gif phải đi `/files/upload` (ghi raw bytes).
- **Video dùng `/files/upload`** vì `/images/upload` re-encode WebP, không decode nổi video.
- Client **phải validate size + extension trước khi upload** (báo lỗi sớm, tránh gửi body lớn vô ích). BE vẫn là nguồn chân lý (validate lại).

### 2.2 Contract dữ liệu

WS `SEND_MESSAGE` sau khi upload xong và có URL:

```jsonc
{ "type": "SEND_MESSAGE", "groupId": 123, "chatType": "PRIVATE" | "GROUP",
  "content": "https://.../images/uuid.webp",     // URL trả về từ endpoint upload
  "messageType": "IMAGE" | "VIDEO",
  "metadata": {
    "fileName": "clip.mp4",     // tên gốc (hiển thị / tải về)
    "size": 12345678,           // bytes raw (trước base64)
    "mimeType": "video/mp4"
    // width/height/durationMs: OPTIONAL — bỏ qua ở MVP, thêm sau nếu cần tránh nhảy layout
  } }
```

- TEXT giữ nguyên (`content`=nội dung, `messageType` mặc định `TEXT`, `metadata` null).
- `metadata` từ REST có thể là **string** → parse an toàn (try/catch) trước khi đọc field.
- WS `SEND_MESSAGE` chỉ mang **URL + metadata nhỏ** → không chạm giới hạn frame WebSocket.

---

## 3. Luồng tổng quát

```
[User chọn ảnh/video]
      │  (1) validate extension + size (CLIENT)
      ▼
[Đọc file → base64]
      │  (2) POST /api/images/upload  (ảnh tĩnh)   |   POST /api/files/upload  (gif + video)
      ▼
[Nhận URL công khai]
      │  (3) WS SEND_MESSAGE { content:URL, messageType:IMAGE|VIDEO, metadata:{...} }
      ▼
[BE insert + broadcast MESSAGE_CREATED]
      ▼
[Mọi client trong group nhận → render inline theo messageType]
```

UX: hiện trạng thái **"Đang tải lên…"** + disable nút gửi khi đang upload; lỗi upload → toast/snackbar + cho thử lại.

---

## 4. Backend — nới trần & bật loại file (bắt buộc)

### 4.1 `shared/service/FileUploadService.java`

- **Allowlist** (`ALLOWED_EXTENSIONS`, ~L35): `{pdf,doc,docx,png,jpg,jpeg}` → **thêm** `webp, gif, mp4, mov, webm, m4v`.
- **Trần theo nhóm** thay cho `MAX_BYTES` cố định 10MB (~L34, L66): map theo extension —
  - video (`mp4/mov/webm/m4v`) → **30 MB**
  - ảnh (`png/jpg/jpeg/webp/gif`) → **10 MB**
  - doc (`pdf/doc/docx`) → giữ **10 MB**
- Sửa message lỗi đang stale (~L60, chỉ liệt kê "pdf, doc, docx").

### 4.2 Body base64 (WebFlux codec) — `application.properties` **và** `application-prod.properties`

- `spring.codec.max-in-memory-size=20MB` → **`50MB`** (đủ chứa base64 của video 30MB ~40MB + headroom). ⚠️ Đây là **buffer trong RAM mỗi request**. (Bắt buộc: 20MB hiện tại **không** chứa nổi base64 40MB của video.)

### 4.3 nginx — `nginx.conf` **và** `nginx.prod.conf`

- `client_max_body_size 50M;` (L26): base64 30MB ~40MB **< 50M nên đã đủ** → **không cần đổi** (chỉ xác nhận). Nếu muốn headroom có thể để `60M`.
- **Timeout upload chậm (tùy chọn):** với video 30MB, mặc định `proxy_read_timeout`/`client_body_timeout` 60s thường đủ; nếu gặp timeout khi mạng yếu thì nâng block `/api/` lên ~`120s`.
- **Serve video:** xác nhận `mime.types` map đúng (`mov→video/quicktime`, `webm→video/webm`); nếu thiếu `m4v` thì thêm `types { video/x-m4v m4v; }`. Range request cơ bản đã hoạt động mặc định (đủ để tua video ngắn).

### 4.4 (Khuyến nghị, tùy chọn) `ImageController` / `ImageService`

- `ImageController` đang **blocking trên event loop** + Scrimage WebP đồng bộ. Cân nhắc chuyển convert sang `Schedulers.boundedElastic()` để không nghẽn Netty event loop. Không bắt buộc cho MVP.

> Không đổi DB, không endpoint mới.

---

## 5. Frontend (React) — kế hoạch

| File | Việc |
|---|---|
| `utils/imageUtils.js` | Thêm hằng + validator: `IMAGE_MAX_BYTES=10MB`, `IMAGE_ACCEPT` (+`webp`,`gif`), `VIDEO_MAX_BYTES=30MB`, `VIDEO_ACCEPT="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.m4v"`, `validateVideoFile(file)`. |
| `utils/api.js` (`chatApi`) | `uploadChatImage(base64)` → `POST /images/upload`; `uploadChatMedia({base64String,fileName})` → `POST /files/upload` (dùng cho **gif + video**). |
| `components/network/NetworkChatPanel.jsx` | Nút đính kèm trong composer → `handleAttach(file)`: validate ext+size → base64 → upload (đúng endpoint theo loại) → **gửi ngay** `wsSendMessage({groupId,content:url,chatType,messageType,metadata})`. Trạng thái "Đang tải lên…" + disable gửi. |
| `components/network/NetworkChatPanel.jsx` (render ~L484) | Branch theo `msg.messageType`: **IMAGE** → `<img src={url} style="max-width:280px;border-radius:8px" />` hiển thị thẳng; **VIDEO** → `<video src={url} controls preload="metadata" style="max-width:300px;border-radius:8px" />` hiển thị thẳng; **nếu `video.canPlayType(mime)` rỗng hoặc `onError`** → hiện `fileName` + nút **Tải về** (`<a href={url} download>`); mặc định → text. Ảnh `onError` → fallback icon + `fileName`. |
| `hooks/mentorship/useChatWebSocket.js`, `hooks/chat/useChatMessages.js` | **Không sửa** (đã hỗ trợ `messageType`/`metadata`). |
| i18n `locales/{en,vi}/*.json` | Key lỗi: `chat.image_too_large`, `chat.video_too_large`, `chat.file_type_unsupported`. |

**Composer:** nút đính kèm mở input `accept` gộp (hoặc menu Ảnh/Video). `<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.m4v">`. Chọn → validate → nếu lỗi hiện snackbar; hợp lệ → upload → gửi ngay.

---

## 6. Mobile (Flutter) — kế hoạch

| File | Việc |
|---|---|
| `core/constants/api_endpoints.dart` | Thêm `static const String fileUpload = '/api/files/upload';` (đã có `imageUpload`). |
| `pubspec.yaml` | Thêm `video_player` (+ `chewie` cho controls) + `url_launcher` (fallback tải về khi không phát được). `image_picker` đã có (`pickImage`/`pickVideo`). |
| `features/chat/data/datasources/chat_api.dart` | `uploadImage(base64)` → `imageUpload`; `uploadMedia({base64String,fileName})` → `fileUpload`. (Có thể tái dùng `user_api.dart:uploadImage` cho ảnh tĩnh.) |
| `features/chat/data/repositories/chat_repository.dart` | `uploadChatImage(File)` / `uploadChatMedia(File)`: đọc bytes → validate ext+size → base64 → datasource → trả URL. |
| `.../providers/chat_messages_provider.dart` | Thêm `sendMedia({url, messageType, metadata, chatType})` gọi `ChatSocketOutbound.sendMessage(...messageType, metadata)` (frame builder đã hỗ trợ). Giữ `send(content)` cho text. |
| `.../widgets/chat_composer.dart` | Nút đính kèm → bottom sheet "Ảnh / Video" → `ImagePicker().pickImage`/`pickVideo` → validate → upload → **gửi ngay** `sendMedia`; trạng thái upload (disable + spinner). |
| `.../widgets/message_bubble.dart` | Branch theo `messageType`: **IMAGE** → `CachedNetworkImage(resolveImageUrl(content))` inline (giới hạn width, bo góc); **VIDEO** → **poster (ô nền xám + icon play, không phải frame thật) + nút play**, bấm mới khởi tạo `Chewie`/`VideoPlayer` (mở inline hoặc trang phát) — **không** khởi tạo player cho mọi bubble. **Nếu player lỗi/không phát được** (vd webm trên iOS) → nút **Tải về / mở ngoài** (`url_launcher`); mặc định → text (như hiện tại ~L56). |
| `assets/translations/{en,vi}.json` | Key lỗi ảnh/video. |

**Chọn + validate (mobile):**
```dart
final picker = ImagePicker();
final XFile? img = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
final XFile? vid = await picker.pickVideo(source: ImageSource.gallery,
    maxDuration: const Duration(minutes: 1)); // giới hạn thời lượng để khống chế size
// validate: ext ∈ {jpg,jpeg,png,webp,gif}≤10MB | {mp4,mov,webm,m4v}≤30MB
// base64: ảnh tĩnh → /images/upload ; gif + video → /files/upload
```
- Ảnh tĩnh: pattern `my_profile_edit_page.dart` (`base64Encode(bytes)` + `data:image/...;base64,`).
- Video/gif: đọc bytes → `base64Encode` → `{ base64String, fileName }` tới `/files/upload`.

---

## 7. Giảm thiểu rủi ro base64 (do đã chốt hướng base64)

- **Mobile:** giới hạn thời lượng khi `pickVideo` (`maxDuration`) + dùng `imageQuality`/nén khi có thể; đọc bytes 1 lần, cân nhắc base64-encode trong **background isolate** để tránh nghẽn UI; báo lỗi rõ khi file quá lớn thay vì để crash.
- **Backend:** mỗi upload video buffer ~40MB RAM/request — nhẹ, theo dõi khi nhiều upload đồng thời.
- **Tương lai:** nếu upload lớn gây bất ổn → chuyển sang **multipart streaming** (endpoint `@RequestPart FilePart` → `DataBufferUtils.write` xuống đĩa) để bỏ buffer toàn file trong RAM và tránh base64 phía mobile.

---

## 8. Checklist file

### Backend / hạ tầng
- [ ] `shared/service/FileUploadService.java` — allowlist (+`webp,gif,mp4,mov,webm,m4v`) + trần theo nhóm (video 30MB / ảnh 10MB / doc 10MB) + sửa message lỗi
- [ ] `application.properties` + `application-prod.properties` — `spring.codec.max-in-memory-size=50MB`
- [ ] `nginx.conf` + `nginx.prod.conf` — xác nhận `client_max_body_size` (50M đã đủ) + mime `m4v` (timeout tùy chọn)

### Frontend (React)
- [ ] `utils/imageUtils.js` — hằng + `validateVideoFile`, mở rộng `IMAGE_ACCEPT`
- [ ] `utils/api.js` — `chatApi.uploadChatImage`, `chatApi.uploadChatMedia`
- [ ] `components/network/NetworkChatPanel.jsx` — nút đính kèm + `handleAttach` + render `<img>`/`<video>`
- [ ] i18n `locales/{en,vi}` — key lỗi

### Mobile (Flutter)
- [ ] `core/constants/api_endpoints.dart` — `fileUpload`
- [ ] `pubspec.yaml` — `video_player` (+ `chewie`) + `url_launcher`
- [ ] `features/chat/data/datasources/chat_api.dart` — `uploadImage`/`uploadMedia`
- [ ] `features/chat/data/repositories/chat_repository.dart` — `uploadChatImage`/`uploadChatMedia` (+validate)
- [ ] `.../providers/chat_messages_provider.dart` — `sendMedia(...)`
- [ ] `.../widgets/chat_composer.dart` — nút đính kèm + picker + trạng thái upload
- [ ] `.../widgets/message_bubble.dart` — branch IMAGE (inline) / VIDEO (poster + tap-to-play)
- [ ] `assets/translations/{en,vi}.json` — key lỗi

> **Tái dùng:** WS layer 2 client (đã hỗ trợ `messageType`/`metadata`), `ImageService`/`FileUploadService` (BE),
> `imageUtils.js` (web), `image_picker` + `resolveImageUrl` + `CachedNetworkImage` (mobile),
> `secureStorage`/`dioProvider`/`apiClient`.

---

## 9. Thứ tự triển khai

1. **Backend nới trần**: FileUploadService (allowlist + trần theo nhóm), `max-in-memory-size=50MB`, xác nhận nginx.
2. **Ảnh (web)**: imageUtils + `uploadChatImage` + composer + render `<img>`. Test web↔web.
3. **Ảnh (mobile)**: chat_api/repo upload + `sendMedia` + composer + `CachedNetworkImage`. Test web↔mobile.
4. **Video (web)**: `validateVideoFile` + `uploadChatMedia` + `<video controls>`.
5. **Video (mobile)**: `video_player`/`chewie` + `pickVideo` + poster/tap-to-play.
6. **gif**: route qua `/files/upload`, xác nhận giữ animation.

---

## 10. Test plan (thủ công / verify)

- [ ] Ảnh `jpg/png/webp` ≤ 10MB → hiển thị thẳng ở web & mobile; **gif động** → còn animation.
- [ ] Video `mp4/mov/webm/m4v` ≤ 30MB → phát được (play/tua) ở web & mobile.
- [ ] Quá trần (ảnh > 10MB / video > 30MB) → client chặn, báo lỗi, **không** upload; nếu lách → BE trả 400 "exceeds limit".
- [ ] Sai loại (`heic/avi/mkv/ogg`…) → client chặn.
- [ ] Text không hồi quy; `metadata` string parse an toàn khi mở lại phòng.
- [ ] nginx không trả **413** với body ~40MB; upload 30MB mạng chậm không **504**.
- [ ] Tin ảnh/video hiển thị đúng cả 2 chiều web↔mobile và trong **group** (đúng người gửi trái/phải, tên+avatar).
- [ ] Lỗi tải ảnh/video (URL hỏng) → fallback (icon + `fileName`), không crash.

---

## 11. Ngoài phạm vi (Out of scope)

- Nhiều file/tin (MVP: 1 file/tin), file tài liệu trong chat (ngoài yêu cầu "ảnh/video").
- Nén/transcode/thumbnail video phía server, HLS/streaming.
- **Multipart/chunked upload** (ghi chú tương lai — Mục 7).
- Progress bar % khi upload (MVP chỉ spinner).
- Quét mã độc / kiểm MIME thực (magic bytes) — nên ghi TODO bảo mật.
- Sửa/xóa/thu hồi tin đính kèm, reactions, forward.

---

## 12. Rủi ro & lưu ý

| Rủi ro | Giảm thiểu |
|---|---|
| base64 30MB → ~40MB RAM/request (BE) & ~40MB chuỗi RAM (mobile) | Mục 7; theo dõi RAM; tương lai chuyển multipart |
| `/images/upload` phá gif/video (WebP) | gif + video **bắt buộc** đi `/files/upload` (raw) |
| nginx 413 / 504 khi file lớn | `client_max_body_size 50M` (đã đủ cho ~40MB); timeout nâng nếu cần |
| `mkv/avi/heic/ogg` không phát/hiển thị inline | Không nằm trong allowlist |
| **webm ✗ iOS/Safari · mov ✗ Firefox** (dù nằm trong allowlist) | Giữ 4 loại nhưng **fallback nút "Tải về"** khi platform không phát được (web `canPlayType`/`onError`, mobile lỗi player → `url_launcher`) |
| `metadata` kiểu String vs Object | Web `JSON.parse` try/catch; mobile parse `dynamic` an toàn |
| Bảo mật: client validate không đủ | BE validate lại extension/size (`FileUploadService`); TODO kiểm magic-bytes |
