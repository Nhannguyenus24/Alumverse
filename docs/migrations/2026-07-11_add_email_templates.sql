-- Email templates quản lý qua Admin.
-- Trước đây nội dung email nằm cứng trong file .html trên classpath. Bảng này cho phép
-- Admin chỉnh sửa subject/nội dung HTML trực tiếp trên giao diện. EmailService sẽ ưu tiên
-- lấy nội dung từ bảng này (theo template_code), nếu content trống thì fallback về file .html.
-- Matches docs/postgre.sql. Idempotent — an toàn khi chạy nhiều lần trên local và cloud.

CREATE TABLE IF NOT EXISTS email_templates
(
    id            bigserial
        PRIMARY KEY,
    template_code varchar(100)                        NOT NULL
        UNIQUE,
    subject       text,
    -- Nội dung HTML (hỗ trợ cú pháp Thymeleaf: th:if/th:utext và inline [[${var}]]).
    -- Để trống -> EmailService dùng lại file templates/<template_code>.html.
    content       text,
    description   text,
    -- Định nghĩa biến khả dụng + giá trị mẫu, dạng JSON array text:
    -- [{"key":"otp","label":"Mã OTP","sample":"123456"}, ...]. Dùng cho chip chèn biến và preview.
    variables     text                     DEFAULT '[]',
    updated_by    bigint,
    updated_at    timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Seed metadata cho các template hiện có. Cột content để trống ('' hoặc NULL): seeder lúc khởi động
-- (EmailTemplateSeeder) sẽ đọc file templates/<code>.html và điền vào nếu content còn trống.
-- Chỉ set subject cho template có subject tĩnh (OTP); các template có subject động (event, mentor)
-- để subject = NULL để EmailService dùng subject truyền vào từ code.
INSERT INTO email_templates (template_code, subject, description, variables)
VALUES
    ('otpVerification',
     'Xác minh OTP - Hệ Thống Alumni HCMUS',
     'Email chứa mã OTP xác minh tài khoản/đổi email.',
     '[{"key":"otp","label":"Mã OTP","sample":"123456"},{"key":"email","label":"Email người nhận","sample":"alumni@example.com"}]'),

    ('eventInvitation',
     NULL,
     'Thư mời tham gia sự kiện. Subject được tạo động từ tên sự kiện.',
     '[{"key":"eventTitle","label":"Tên sự kiện","sample":"Ngày hội việc làm 2026"},{"key":"eventLocation","label":"Địa điểm","sample":"Cơ sở Nguyễn Văn Cừ"},{"key":"eventStartTime","label":"Thời gian bắt đầu","sample":"08:00 15/08/2026"},{"key":"confirmToken","label":"Token xác nhận","sample":"abc123token"}]'),

    ('eventReminder',
     NULL,
     'Email nhắc sự kiện. Subject và phần thân (customBody) được truyền động khi gửi.',
     '[{"key":"eventTitle","label":"Tên sự kiện","sample":"Ngày hội việc làm 2026"},{"key":"eventLocation","label":"Địa điểm","sample":"Cơ sở Nguyễn Văn Cừ"},{"key":"eventStartTime","label":"Thời gian bắt đầu","sample":"08:00 15/08/2026"},{"key":"customBody","label":"Nội dung tuỳ chỉnh (HTML)","sample":"<p>Hẹn gặp bạn tại sự kiện!</p>"}]'),

    ('eventTicket',
     NULL,
     'Email gửi vé tham dự sự kiện kèm mã vé.',
     '[{"key":"eventTitle","label":"Tên sự kiện","sample":"Ngày hội việc làm 2026"},{"key":"eventLocation","label":"Địa điểm","sample":"Cơ sở Nguyễn Văn Cừ"},{"key":"eventStartTime","label":"Thời gian bắt đầu","sample":"08:00 15/08/2026"},{"key":"guestName","label":"Tên khách","sample":"Nguyễn Văn A"},{"key":"ticketCode","label":"Mã vé","sample":"TICKET-0001"}]'),

    ('mentorApplicationReview',
     NULL,
     'Email thông báo kết quả duyệt hồ sơ Mentor. Có nhánh điều kiện theo status (dùng chế độ HTML).',
     '[{"key":"recipientName","label":"Tên người nhận","sample":"Nguyễn Văn A"},{"key":"status","label":"Trạng thái (APPROVED/REJECTED/NEED_UPDATE)","sample":"APPROVED"},{"key":"statusLabel","label":"Nhãn trạng thái","sample":"Đã duyệt"},{"key":"reason","label":"Lý do / yêu cầu","sample":"Hồ sơ đầy đủ."}]'),

    ('donationThankYou',
     NULL,
     'Email cảm ơn quyên góp.',
     '[{"key":"donorName","label":"Tên nhà hảo tâm","sample":"Nguyễn Văn A"},{"key":"donationAmount","label":"Số tiền","sample":"1.000.000đ"},{"key":"donationDate","label":"Ngày quyên góp","sample":"15/08/2026"},{"key":"donationPurpose","label":"Mục đích","sample":"Quỹ học bổng"},{"key":"referenceNumber","label":"Mã tham chiếu","sample":"REF-0001"}]')
ON CONFLICT (template_code) DO NOTHING;
