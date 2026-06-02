# Conversation Request – Design Notes

## Tại sao update `requester_member_id` và `target_member_id` khi re-request sau REJECTED?

### Bối cảnh

Bảng `chat_conversation_requests` có **unique index** trên `(member_low_id, member_high_id)`,
nghĩa là mỗi cặp thành viên chỉ tồn tại **đúng một bản ghi** duy nhất, bất kể ai là người
gửi hay người nhận.

Hai trường `member_low_id` / `member_high_id` là bất biến, chỉ dùng để tra cứu nhanh theo cặp.
Hai trường `requester_member_id` / `target_member_id` mới là metadata nghiệp vụ, thể hiện
**ai đang gửi request** và **ai đang nhận request** trong vòng hiện tại.

### Vấn đề nếu không update

Giả sử:

1. **B** gửi request cho **A** → `requester = B`, `target = A`.
2. **A** từ chối (REJECTED).  Cooldown 7 ngày bắt đầu.
3. Cooldown hết.  Lần này **A** muốn chủ động gửi lại cho **B**.

Khi đó `currentMemberId = A`, `targetMemberId = B`.  
Bản ghi cũ vẫn ghi `requester = B`, `target = A`.

Nếu **không** update hai trường này:

- Trang **Incoming Requests** của **B** sẽ hiện request mới này (vì `target_member_id = A`
  khớp với B = người đang xem) — **sai**, vì B không phải người nhận request lần này.
- Ngược lại, **A** (người thực sự gửi) không thấy request của mình ở đâu trong UI.
- Các query `searchIncomingRequests` lọc theo `WHERE target_member_id = :currentUserId` sẽ
  trả về dữ liệu sai lệch.

### Giải pháp

Mỗi khi một re-request được chấp nhận (REJECTED + cooldown hết), ta **luôn** ghi đè:

```
requester_member_id = currentMemberId   // người đang gửi lần này
target_member_id    = targetMemberId    // người sẽ nhận và phán quyết
```

Điều này đảm bảo `requester / target` luôn phản ánh **đúng chiều của request hiện tại**,
bất kể lịch sử các vòng trước.

### Các field được update khi re-request

| Field                    | Giá trị mới                        | Lý do                                          |
|--------------------------|------------------------------------|------------------------------------------------|
| `requester_member_id`    | `currentMemberId`                  | Người gửi có thể đổi chiều so với vòng trước  |
| `target_member_id`       | `targetMemberId`                   | Người nhận có thể đổi chiều so với vòng trước |
| `last_request_message_id`| ID của message vừa insert          | Hiển thị tin nhắn mới nhất trong incoming page |
| `status`                 | `PENDING`                          | Reset về trạng thái chờ phản hồi               |
| `cooldown_until`         | `messageCreatedAt + 7 ngày`        | Cửa sổ cooldown mới tính từ lúc gửi           |
| `updated_at`             | tự động qua `@LastModifiedDate`    | Audit trail                                    |

### Các field KHÔNG thay đổi

| Field            | Lý do                                                              |
|------------------|--------------------------------------------------------------------|
| `member_low_id`  | Khoá định danh cặp thành viên, bất biến                            |
| `member_high_id` | Khoá định danh cặp thành viên, bất biến                            |
| `chat_group_id`  | Group chat đã tồn tại, tái sử dụng để lưu lịch sử toàn bộ vòng   |
| `created_at`     | Audit trail — thời điểm tạo bản ghi lần đầu, không bị overwrite   |
