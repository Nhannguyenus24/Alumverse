# Plan: Đổi ảnh group chat (button trong drawer, mọi member đổi được)

> Tính năng: Thêm một button cho phép đổi ảnh (avatar) của group chat. Button đặt trong
> drawer/trang settings của group chat, **chỉ áp dụng cho group chat** (không áp dụng chat 1-1),
> và **chỉ owner của group** mới đổi được (giống luồng đổi tên group).

## Bối cảnh & phát hiện quan trọng

Trước khi vào plan, có **3 điều then chốt** ảnh hưởng đến scope:

1. **Backend chưa có field ảnh cho group.** Entity `ChatGroup` chỉ có
   `id, type, title, createdBy, createdAt, updatedAt` — không có cột ảnh. Group chat hiện luôn
   render icon fallback. ⟹ Tính năng này **bắt buộc phải sửa backend**, không chỉ là UI.

2. **Endpoint update group hiện tại là owner-only + chỉ đổi title.**
   `PUT /api/chat/groups/{groupId}` gọi `ChatService.updateGroupInfo` có check
   *"Only group owner can update group info"* và `UpdateGroupRequest` có `@NotBlank title`.
   Đổi ảnh cũng **owner-only** (giống đổi tên), nhưng vì `UpdateGroupRequest.title` đang
   `@NotBlank` (bắt buộc), nếu nhét ảnh chung endpoint sẽ phải nới validation → vẫn **tạo
   endpoint riêng cho ảnh** cho gọn, chỉ copy đúng phần check owner của `updateGroupInfo`.

3. **Không có realtime broadcast cho metadata group.** Luồng đổi tên hiện tại không đẩy WebSocket —
   client tự refetch (invalidate query). Ảnh sẽ theo đúng pattern này để giữ scope gọn
   (realtime là optional, xem cuối plan).

Pattern để "soi" và bám theo: **luồng đổi tên group (rename)** đã có sẵn ở cả 3 platform.

---

## Phase 1 — Backend (Java / Spring) — *bắt buộc làm trước*

Đây là nền tảng cho web + mobile, nên làm và merge trước.

### 1.1. Thêm cột ảnh vào entity + DB
- `backend/src/main/java/com/service/backend/shared/entity/ChatGroup.java`: thêm field
  `String avatarUrl` map cột `avatar_url` (theo naming của user avatar hiện tại).
- Thêm **DB migration** tạo cột `chat_groups.avatar_url` (nullable).

### 1.2. Trả ảnh về cho client (để hiển thị)
- `chat/dto/GroupChatListItemResponse.java`: thêm `avatarUrl` → để list chat và header hiển thị ảnh.
- `chat/dto/ChatGroupMetadataResponse.java`: thêm `avatarUrl` → để trang settings/drawer hiển thị
  ảnh hiện tại.
- Cập nhật chỗ build 2 DTO này trong `ChatService` để set `avatarUrl` từ entity.

### 1.3. Endpoint mới (owner-only, group-only)
- `chat/controller/ChatController.java`: thêm `PUT /api/chat/groups/{groupId}/avatar`,
  body `{ avatarUrl }` (DTO mới `UpdateGroupAvatarRequest { @NotBlank String avatarUrl }`).
- `ChatService`: method mới `updateGroupAvatar(groupId, requesterId, avatarUrl)`, logic gần giống
  `updateGroupInfo`:
  - Check group tồn tại.
  - Check **owner** — `if (!requesterId.equals(group.getCreatedBy())) → FORBIDDEN` (copy đúng
    check của `updateGroupInfo`).
  - Check `group.getType() == ChatType.GROUP` (chặn chat 1-1) → nếu không, trả lỗi.
  - `setAvatarUrl` + `setUpdatedAt` + save.

### 1.4. Upload ảnh
Tái sử dụng nguyên `POST /api/files/upload` / `FileUploadService.uploadBase64File` (đã validate
ảnh png/jpg/jpeg/webp/gif, ≤10MB, trả về URL). Không cần code mới ở đây.

> **Luồng chuẩn:** client upload base64 → nhận URL → gọi `PUT .../avatar` với URL đó
> (giống hệt pattern `PUT /api/users/avatar` của user).

---

## Phase 2 — Frontend Web (React)

Bám theo pattern rename trong `GroupMembersDrawer.jsx`.

### 2.1. `frontend/src/components/network/GroupMembersDrawer.jsx` (nơi chính)
- Thêm button "Đổi ảnh nhóm" vào **block `isOwner`** (cạnh nút rename, ~lines 289-298) — đặt
  chung điều kiện `isOwner` với nút đổi tên, **không** đặt ở block dành cho mọi member.
- Thêm hidden `<input type="file" accept={IMAGE_ACCEPT}>` + `fileInputRef`.
- Handler: dùng `useUploadImage()` (hoặc `validateImageFile` + `fileToBase64` +
  `chatApi.uploadChatImage`) → lấy URL → gọi mutation mới.
- Mutation mới (mirror `renameMutation`, lines 110-116): gọi `chatApi.updateGroupImage(gId, imageUrl)`
  → onSuccess `invalidateChatListQueries(queryClient)`.
- Thêm state loading (`isUploadingImage`) + gộp lỗi vào `mutationError`.

### 2.2. `frontend/src/utils/api.js`
Thêm `chatApi.updateGroupImage(groupId, avatarUrl)` → `PUT /chat/groups/${groupId}/avatar`
body `{ avatarUrl }` (đặt cạnh `updateGroup`, line 332). Upload đã có sẵn `uploadChatImage` (line 435).

### 2.3. `frontend/src/pages/chat/ChatPage.jsx`
Trong `normalizeGroupChat()` (lines 15-23) thêm `avatarUrl: item.avatarUrl` để ảnh mới render ở
header (`NetworkChatPanel`) và sidebar (`NetworkChatSidebar`) qua `ChatAvatar` (đã support
`variant='group'`).

### 2.4. i18n
`frontend/src/i18n/locales/{en,vi}/network.json`: thêm keys `change_group_image`,
`change_group_image_title`, và error `chat.image_update_failed` (đặt cạnh `rename_group`).

**Tái sử dụng, không cần sửa:** `imageUtils.js` (`useUploadImage`, `validateImageFile`,
`IMAGE_ACCEPT`), `ChatAvatar.jsx`.

---

## Phase 3 — Mobile (Flutter)

Bám theo rename trong `group_members_page.dart` + image-picker trong `chat_composer.dart`.

### 3.1. `mobile_flutter/lib/features/chat/presentation/pages/group_members_page.dart` (nơi chính)
Page settings mở từ AppBar `Icons.group_outlined` của chat room.
- Thêm button "Đổi ảnh nhóm" **gate bằng `if (isOwner)`** (giống nút rename ở lines 94-105).
- Handler theo pattern `chat_composer._pickAndSend` (lines 92-121):
  `ImagePicker().pickImage(gallery, imageQuality: 85)` → `File(picked.path)` → upload → lấy URL →
  gọi repo update → `ref.invalidate(chatListProvider)` → `setState` cập nhật ảnh local +
  `AppToast.success`.
- Thêm cờ `_isUploading` + `CircularProgressIndicator`.

### 3.2. Data layer
- `mobile_flutter/lib/core/constants/api_endpoints.dart`: thêm
  `chatGroupAvatarUpdate(int groupId) => '/api/chat/groups/$groupId/avatar'`.
- `chat/data/datasources/chat_api.dart`: thêm `updateGroupAvatar(int groupId, String avatarUrl)` →
  PUT body `{'avatarUrl': avatarUrl}`. Upload đã có `uploadImage(base64)` (lines 159-170).
- `chat/data/repositories/chat_repository.dart`: thêm `uploadGroupImage(File)`
  (base64 encode → `_api.uploadImage`) + `updateGroupAvatar(groupId, url)`.

### 3.3. Model hiển thị
- `chat/data/models/chat_conversation.dart`: trong `fromGroupJson` (lines 54-65) parse
  `json['avatarUrl']` vào field `avatarUrl` (hiện comment "groups have none").
- `conversation_tile.dart` (lines 23-45) đã render `resolveImageUrl(conversation.avatarUrl)` →
  tự động hiện ảnh khi model có.

### 3.4. i18n
`mobile_flutter/assets/translations/{en,vi}.json`: thêm `chat.change_group_image`,
`chat.group_image_updated` (cạnh `rename_group`). Dùng lại `chat.upload_failed`,
`common.cancel/save`.

**Đã có sẵn dep:** `image_picker`, `cached_network_image`, `dio`.

---

## Phase 4 — Test & verify

- **Backend:** owner đổi được ảnh; non-owner (member thường) bị chặn `FORBIDDEN`; non-member bị chặn;
  chat PRIVATE bị chặn; ảnh trả về đúng trong list + metadata.
- **Web & Mobile:** button chỉ hiện với group **và chỉ owner mới thấy** (không hiện ở chat 1-1,
  không hiện với member thường); upload sai định dạng/quá lớn báo lỗi đúng; sau khi đổi, ảnh cập nhật
  ở drawer + header + list (nhờ invalidate).

---

## Quyết định thiết kế (đề xuất mặc định)

| Vấn đề | Lựa chọn đề xuất | Lý do |
|---|---|---|
| Endpoint | **Tách riêng** `PUT .../avatar` | Cùng owner-only như rename, nhưng `UpdateGroupRequest.title` đang `@NotBlank`; tách cho gọn, khỏi nới validation |
| Quyền | **Owner-only** | Đồng nhất với luồng đổi tên group |
| Tên cột | `avatar_url` / `avatarUrl` | Đồng bộ với user avatar sẵn có |
| Realtime | **Out-of-scope** (client refetch) | Rename hiện cũng không broadcast; thêm event WebSocket là net-new, làm sau nếu cần |
| Crop ảnh | Không crop (dùng thẳng) | Gọn; `ChatAvatar`/`CircleAvatar` tự bo tròn. Có `fileToCroppedCoverBase64` nếu sau muốn crop vuông |

---

## Tổng hợp file cần đụng tới

**Backend**
- `shared/entity/ChatGroup.java` (thêm `avatarUrl`)
- Migration `chat_groups.avatar_url`
- `chat/dto/GroupChatListItemResponse.java`, `chat/dto/ChatGroupMetadataResponse.java` (thêm `avatarUrl`)
- `chat/dto/UpdateGroupAvatarRequest.java` (mới)
- `chat/controller/ChatController.java` (endpoint mới)
- `chat/service/ChatService.java` (method mới + set `avatarUrl` vào DTO)
- Tái sử dụng: `shared/service/FileUploadService.java`, `POST /api/files/upload`

**Frontend Web**
- `components/network/GroupMembersDrawer.jsx` (button + input + mutation)
- `utils/api.js` (`updateGroupImage`)
- `pages/chat/ChatPage.jsx` (`normalizeGroupChat` thêm `avatarUrl`)
- `i18n/locales/{en,vi}/network.json`
- Tái sử dụng: `utils/imageUtils.js`, `components/ChatAvatar.jsx`

**Mobile**
- `presentation/pages/group_members_page.dart` (button + handler)
- `core/constants/api_endpoints.dart` (endpoint)
- `data/datasources/chat_api.dart` (`updateGroupAvatar`)
- `data/repositories/chat_repository.dart` (`uploadGroupImage`, `updateGroupAvatar`)
- `data/models/chat_conversation.dart` (parse `avatarUrl` trong `fromGroupJson`)
- `assets/translations/{en,vi}.json`
- Tái sử dụng: `conversation_tile.dart`, `image_picker`
