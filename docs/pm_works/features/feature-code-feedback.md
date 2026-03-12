# Feedback: Đối chiếu tính năng với code

> Bảng mapping giữa tính năng cốt lõi và vị trí code tương ứng. Cập nhật khi review hoặc thay đổi tính năng.

---

## Hướng dẫn sử dụng

1. **Backend:** ghi rõ Controller + method (vd: `AuthController#register`)
2. **Frontend:** ghi route + page/component chính
3. **Khớp:** ✅ Khớp / ⚠️ Thiếu / ❌ Lệch
4. **Ghi chú:** vấn đề cần fix, TODO, hoặc thay đổi

---

## Mapping tính năng ↔ Code

### 0. Multi-tenant & Admin thiết lập

| Tính năng | Backend | Frontend | Khớp | Ghi chú |
|-----------|---------|----------|------|---------|
| MT-01 Tạo trang khoa | | | | TODO: chưa có |
| MT-02 Cấu hình bố cục | | | | |
| MT-03 Chọn tính năng | | | | |
| MT-04 Admin & phân quyền | | | | |
| MT-05 Preview & Launch | | | | |

---

### 1. Xác thực (Auth)

| Tính năng | Backend | Frontend | Khớp | Ghi chú |
|-----------|---------|----------|------|---------|
| AUTH-01 Đăng ký | `AuthController#register` | `/auth/register` → `RegisterPage` | | |
| AUTH-02 Đăng nhập | `AuthController#login` | `/auth/login` → `LoginPage` | | |
| AUTH-03 Kích hoạt | `AuthController#activateUser` | `SignupCodePage` | | |
| AUTH-04 Đăng xuất | `AuthController#logout` | Header / AccountMenu | | |
| AUTH-05 Refresh | `AuthController#refresh` | `axios.js` interceptor | | |
| AUTH-06 Quên mật khẩu | `AuthController#sendOtp`, `verifyOtp` | `/auth/forgot-password`, `reset-password` | | |

---

### 2. Diễn đàn (Forum)

| Tính năng | Backend | Frontend | Khớp | Ghi chú |
|-----------|---------|----------|------|---------|
| FORUM-01 Category | `ForumController#getCategory`, `postCategory` | | | |
| FORUM-02 Topic | `ForumController` topic endpoints | `/forum` → `ForumPage` | | |
| FORUM-03 Post | `ForumController` post, answer | `/forum/alumni/career`, `ForumAlumniThreadPage` | | |
| FORUM-04 Search | `ForumController#searchTopic` | `ForumFilterPanel` | | |
| FORUM-05 Ban/Unban | `ForumController#banPost`, `unbanPost` | | | |

---

### 3. Sự kiện (Events)

| Tính năng | Backend | Frontend | Khớp | Ghi chú |
|-----------|---------|----------|------|---------|
| EVENT-01 CRUD | `EventController` | | | Có route dashboard? |
| EVENT-02 Publish | `EventController#publish`, `unpublish` | | | |
| EVENT-03 Interest | `EventController#interest`, `interests` | | | |
| EVENT-04 Register | `EventController#register` | | | |
| EVENT-05 Check-in | `EventController#checkIn` | | | |
| EVENT-06 My tickets | `EventController#getMyTickets` | | | |
| EVENT-07 Statistics | `EventController#getStatistics` | | | |

---

### 4. Chat

| Tính năng | Backend | Frontend | Khớp | Ghi chú |
|-----------|---------|----------|------|---------|
| CHAT-01 Private | `ChatController#createPrivateChat` | | | |
| CHAT-02 Group | `ChatController#createGroupChat`, `addMembers` | | | Có UI chat? |
| CHAT-03 Messages | `ChatController#getMessages` (WebSocket) | `chat.html`, `websocket-test.html` | | |

---

### 5. Mentorship

| Tính năng | Backend | Frontend | Khớp | Ghi chú |
|-----------|---------|----------|------|---------|
| MENTOR-01 Đăng ký mentor | | | | TODO: chưa có |
| MENTOR-02 Matchmaking | | | | |
| MENTOR-03 Đặt lịch 1-1 | | | | |
| MENTOR-04 Theo dõi tiến độ | | | | |
| MENTOR-05 Feedback | | | | |
| MENTOR-06 Recognition/Badge | | | | |

---

### 6. Articles / Resources

| Tính năng | Backend | Frontend | Khớp | Ghi chú |
|-----------|---------|----------|------|---------|
| NEWS | `NewsController` | | | |
| Learning Resource | `LearningResourceController` | | | |
| Job | `JobController` | | | Forum Alumni Career? |
| Achievement | `AchievementController` | | | |
| Saved Item | `SavedItemController` | | | |

---

### 7. UI / Pages

| Trang | Route | Component | Backend API chính | Ghi chú |
|-------|-------|-----------|-------------------|---------|
| Trang chủ | `/` | `HomePage` | | |
| Giới thiệu | `/introduction` | `IntroducePage` | | |
| Liên hệ | `/contact` | `ContactPage` | | |
| Khoa | `/faculties`, `/faculties/information-technology` | `FacultiesPage`, `FacultyCNTTPage` | | |
| Dashboard | `/dashboard` | `DashboardPage` | | |
| Forum | `/forum`, `/forum/alumni/career/*` | `ForumPage`, `ForumAlumniCareerPage` | ForumController | |

---

## Tổng kết đối chiếu

| Loại | Số lượng | Ghi chú |
|------|----------|---------|
| ✅ Khớp đầy đủ | | |
| ⚠️ Backend có, Frontend chưa | | |
| ⚠️ Frontend có, Backend thiếu | | |
| ❌ Lệch logic / Bug | | |

---

## Cập nhật

- **Ngày:** 
- **Người review:**
- **Thay đổi:**
