# Tính năng cốt lõi - Alumnverse

> Danh sách các tính năng chính của hệ thống. Tham khảo: Proposed Features, [NEW] Alumverse Features.xlsx, Khảo sát HCMUS, refactoring-analysis.md.

---

## 0. Multi-tenant & Trang thiết lập (Admin)

| ID | Tính năng | Mô tả | Trạng thái |
|----|-----------|-------|------------|
| MT-01 | Tạo trang mới cho khoa | Subdomain, thông tin khoa, logo, hình ảnh, màu sắc | |
| MT-02 | Cấu hình nâng cao | Màu chữ, màu div, preview | |
| MT-03 | Chọn tính năng theo khoa | Tick bật/tắt từng tính năng cho trang khoa | |
| MT-04 | Tạo admin & phân quyền | Tài khoản admin mới, phân quyền | |
| MT-05 | Preview & Launch | Xem trước với data mẫu, phát hành trang | |

---

## 1. Xác thực & Phân quyền

| ID | Tính năng | Mô tả | Trạng thái |
|----|-----------|-------|------------|
| AUTH-01 | Đăng ký tài khoản | Đăng ký bằng email, username, password | |
| AUTH-02 | Đăng nhập | Login bằng username/email + password, nhận JWT | |
| AUTH-03 | Kích hoạt tài khoản | Xác minh OTP qua email để activate | |
| AUTH-04 | Đăng xuất | Logout, thu hồi refresh token | |
| AUTH-05 | Làm mới token | Refresh access token | |
| AUTH-06 | Quên mật khẩu | Gửi OTP, verify và reset password | |
| AUTH-07 | Phân quyền | Role-based access (Admin, User, …) | |

---

## 2. Diễn đàn (Forum)

| ID | Tính năng | Mô tả | Trạng thái |
|----|-----------|-------|------------|
| FORUM-01 | Quản lý category | CRUD category diễn đàn | |
| FORUM-02 | Quản lý topic | CRUD topic theo category | |
| FORUM-03 | Bài viết (post) | Tạo, sửa, xóa post; trả lời post | |
| FORUM-04 | Tìm kiếm topic | Search topic | |
| FORUM-05 | Ban/Unban post | Admin ban/unban bài viết | |
| FORUM-06 | Forum Alumni Career | Diễn đàn sự nghiệp cựu sinh viên | |

---

## 3. Sự kiện (Events)

| ID | Tính năng | Mô tả | Trạng thái |
|----|-----------|-------|------------|
| EVENT-01 | CRUD sự kiện | Tạo, cập nhật, xóa sự kiện | |
| EVENT-02 | Xuất bản / Ẩn | Publish/unpublish sự kiện | |
| EVENT-03 | Quan tâm sự kiện | Interest/attendee | |
| EVENT-04 | Đăng ký tham dự | Đăng ký và nhận vé (ticket) | |
| EVENT-05 | Check-in | Quét mã vé check-in | |
| EVENT-06 | Vé của tôi | Xem danh sách vé đã đăng ký | |
| EVENT-07 | Thống kê sự kiện | Thống kê theo event | |

---

## 4. Tin nhắn (Chat)

| ID | Tính năng | Mô tả | Trạng thái |
|----|-----------|-------|------------|
| CHAT-01 | Chat riêng | Tạo/lấy private chat 1-1 | |
| CHAT-02 | Nhóm chat | Tạo group chat, thêm/xóa thành viên | |
| CHAT-03 | Tin nhắn nhóm | Gửi/nhận tin nhắn trong group | |
| CHAT-04 | Danh sách nhóm | Lấy danh sách group của user | |
| CHAT-05 | Cập nhật/ rời nhóm | Update group info, leave group | |

---

## 5. Nội dung (Articles/Resources)

| ID | Tính năng | Mô tả | Trạng thái |
|----|-----------|-------|------------|
| NEWS-01 | Tin tức | CRUD, publish, search tin tức | |
| LEARN-01 | Tài nguyên học tập | CRUD, filter theo type, search | |
| JOB-01 | Việc làm | CRUD job, active/deactivate, search | |
| ACHIEVE-01 | Thành tựu | CRUD achievement, theo member, status | |
| SAVE-01 | Lưu mục | Lưu/bỏ lưu item (news, job, learning resource) | |

---

## 6. Mentorship ⭐ (Ưu tiên cao)

| ID | Tính năng | Mô tả | Trạng thái |
|----|-----------|-------|------------|
| MENTOR-01 | Đăng ký mentor | Cựu SV đăng ký làm mentor, admin duyệt | |
| MENTOR-02 | Matchmaking | Ghép mentor–mentee theo ngành/kỹ năng | |
| MENTOR-03 | Đặt lịch 1-1 | Khung giờ rảnh, đặt lịch tư vấn | |
| MENTOR-04 | Theo dõi tiến độ | Hệ thống theo dõi tiến độ mentee | |
| MENTOR-05 | Feedback & đánh giá | Form feedback, đánh giá mentor | |
| MENTOR-06 | Recognition/Badge | Ghi nhận, badge cho mentor | |

---

## 7. Giao diện & Trải nghiệm

| ID | Tính năng | Mô tả | Trạng thái |
|----|-----------|-------|------------|
| UI-01 | Trang chủ | Landing page | |
| UI-02 | Giới thiệu | Introduction page | |
| UI-03 | Liên hệ | Contact page | |
| UI-04 | Khoa | Faculties, Faculty CNTT | |
| UI-05 | Dashboard | Trang quản trị (sau đăng nhập) | |
| UI-06 | FitBot | Chatbot hỗ trợ | |

---

## Ghi chú

- **Trạng thái:** điền `✅ Done` / `🔄 In progress` / `⏳ TODO` / `❌ Blocked`
- Thêm tính năng mới khi phát triển
- Đối chiếu với code thực tế tại [`feature-code-feedback.md`](./feature-code-feedback.md)
