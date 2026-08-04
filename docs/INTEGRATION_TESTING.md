# Integration Test Coverage

## Mục đích

Bộ test trong `backend/src/test/java/com/service/backend/integration` kiểm tra API end-to-end ở mức ứng dụng: request đi qua Spring Boot/WebFlux, security, service, repository và PostgreSQL thật do Testcontainers cung cấp.

Các test tập trung vào những luồng nghiệp vụ quan trọng, gồm cả trường hợp thành công, validation, phân quyền, dữ liệu không tồn tại, trạng thái không hợp lệ và các thao tác CRUD liên quan.

## Tổng quan

Lần chạy xác nhận ngày 04/08/2026 có 18 test class cụ thể, 234 test case; `BaseIntegrationTest` là lớp dùng chung và không chứa test case độc lập.

```text
Tests run: 234, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

## Nội dung được kiểm thử

| Test class | Số test | Chức năng chính |
|---|---:|---|
| `AuthIntegrationTest` | 13 | Đăng ký, validation email/password/name, email trùng, OTP, đăng nhập đúng/sai, tài khoản chưa kích hoạt/bị khóa, định dạng token. |
| `AuthTokenAndOtpIntegrationTest` | 21 | Refresh token hợp lệ/hết hạn/sai format, quên và đặt lại mật khẩu, xác thực email, OTP sai/hết hạn, Google login với token hợp lệ/không hợp lệ. |
| `UserIntegrationTest` | 16 | Xem/cập nhật profile, kiểm tra token, không cho sửa role, đổi mật khẩu, upload avatar, public profile và validation dữ liệu. |
| `AchievementIntegrationTest` | 6 | Tạo achievement theo role, trạng thái pending, danh sách, cập nhật, xóa, approve/reject. |
| `AlumniPostIntegrationTest` | 16 | CRUD alumni post, publish/hide, tìm kiếm, lấy theo id/slug, comment và reply comment. |
| `NewsIntegrationTest` | 15 | CRUD news, publish/hide, danh sách/published/search/slug, comment và reply comment. |
| `JobIntegrationTest` | 10 | Tạo job theo role, trạng thái active/inactive, CRUD, open jobs và search. |
| `LearningResourceIntegrationTest` | 7 | Tạo resource theo role, pending, danh sách/chi tiết, cập nhật, xóa, approve/reject. |
| `SavedItemIntegrationTest` | 5 | Save item, chống lưu trùng, kiểm tra trạng thái, lấy danh sách đã lưu và unsave. |
| `EventIntegrationTest` | 17 | Danh sách/search/pagination, tạo event và phân quyền, chi tiết, đăng ký, full capacity, duplicate, event đã kết thúc và hủy vé. |
| `ForumIntegrationTest` | 18 | Category, topic, subscribe/unsubscribe, post, answer, reaction/unreaction, report và xóa nội dung. |
| `ChatIntegrationTest` | 24 | Tìm member, connection request, private chat, group chat, member group, message, preview, block/unblock và xóa group. |
| `FundraisingIntegrationTest` | 14 | Thông tin nhận tiền, bank, tạo/cập nhật/đóng fund, danh sách/chi tiết/statistics, donation và lịch sử donation. |
| `MentorshipIntegrationTest` | 34 | Tìm/lọc mentor, hồ sơ mentor/mentee, expertise, availability, booking session, conflict, cập nhật/hủy session và trạng thái draft. |
| `OrganizationIntegrationTest` | 5 | Danh sách organization, tìm theo slug, introduction, feedback và trusted verifiers. |
| `SurveyIntegrationTest` | 4 | Survey đang active, chi tiết, submit survey và xem submission của user. |
| `AdminIntegrationTest` | 7 | Login history, thống kê đăng nhập, suspicious login, admin actions, facets và summary. |
| `ConfigIntegrationTest` | 2 | Health endpoint và SSE connect. |

## Những phần không kiểm thử live

- Google OAuth provider thật không được gọi ra ngoài; test chỉ kiểm tra nhánh xử lý token qua mock/test configuration.
- Firebase push notification, email provider, AI provider, payment gateway và dịch vụ bên ngoài không phải dependency live của suite.
- Các test sử dụng database container riêng, không dùng dữ liệu production.

## Hạ tầng test

- JDK và Maven Wrapper của project.
- Docker Desktop hoặc Rancher Desktop đang chạy và cho phép Testcontainers truy cập Docker Engine.
- Không cần chạy PostgreSQL thủ công.

`BaseIntegrationTest` tự khởi động PostgreSQL 16 bằng Testcontainers, nạp dữ liệu từ `docs/postgre_new.sql`, cấu hình profile `test` và dọn container sau khi test kết thúc. Email và các dịch vụ bên ngoài được mock hoặc tắt trong môi trường test.

## Cách chạy

Từ thư mục `backend`:

```powershell
$classes = (Get-ChildItem src\test\java\com\service\backend\integration -Filter '*IntegrationTest.java' |
  Where-Object { $_.BaseName -ne 'BaseIntegrationTest' } |
  Sort-Object Name |
  ForEach-Object { $_.BaseName }) -join ','
.\mvnw.cmd -B -ntp "-Dtest=$classes" test -DskipTests=false
```

Báo cáo Surefire nằm trong `backend/target/surefire-reports`.

## Giới hạn

- Docker phải chạy trước khi test; nếu Docker không khả dụng, Spring context sẽ không khởi động được.
- Đây là integration test của backend, không thay thế frontend E2E test hoặc kiểm thử thủ công với provider thật.

## Checklist trước khi merge

1. Docker đang chạy.
2. Chạy command integration test ở trên.
3. Xác nhận `Failures: 0`, `Errors: 0` và `BUILD SUCCESS`.
4. Không commit các file sinh ra trong `backend/target`.