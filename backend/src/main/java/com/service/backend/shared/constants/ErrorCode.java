package com.service.backend.shared.constants;

import lombok.Getter;

@Getter
public enum ErrorCode {
    RESOURCES_DUPLICATE("Tài nguyên đã tồn tại"),
    INVALID_PASSWORD("Mật khẩu không hợp lệ"),
    USER_NOT_FOUND("Không tìm thấy người dùng"),
    RESOURCES_NOT_FOUND("Không tìm thấy tài nguyên"),
    FORBIDDEN("Bạn không có quyền truy cập"),

    // Auth module
    EMAIL_OR_USERNAME_ALREADY_REGISTERED("Email or username already registered"),
    USERNAME_ALREADY_EXISTS("Username already exists"),
    INVALID_CREDENTIALS("Invalid email or password"),
    INVALID_USERNAME_CREDENTIALS("Invalid username or password"),
    INVALID_OLD_PASSWORD("Invalid old password"),
    OTP_EXPIRED_NOT_FOUND("OTP expired or not found"),
    INVALID_OTP("Invalid OTP"),
    ACCOUNT_NOT_VERIFIED("Account is not verified. Please verify your email with OTP."),
    REFRESH_TOKEN_NOT_FOUND("Refresh token not found"),
    INVALID_REFRESH_TOKEN("Invalid or expired refresh token"),
    ACCESS_TOKEN_NOT_FOUND("Access token not found"),
    INVALID_ACCESS_TOKEN("Invalid or expired access token"),
    ERROR_SIGNING_JWT_TOKEN("Error signing JWT token"),
    ERROR_VALIDATE_JWT_TOKEN("Error validating JWT token"),

    // Event module
    EVENT_NOT_FOUND("Không tìm thấy sự kiện"),
    TICKET_NOT_FOUND("Không tìm thấy vé"),
    EVENT_FULLY_BOOKED("Sự kiện đã hết chỗ"),
    ALREADY_INTERESTED("Bạn đã đăng ký quan tâm sự kiện này"),
    TICKET_ALREADY_CANCELLED("Vé đã được hủy trước đó"),
    TICKET_ALREADY_CHECKED_IN("Vé đã được check-in"),

    // Article module
    NEWS_NOT_FOUND("Không tìm thấy tin tức"),
    ALUMNI_POST_NOT_FOUND("Không tìm thấy bài viết cựu sinh viên"),
    JOB_NOT_FOUND("Không tìm thấy việc làm"),
    LEARNING_RESOURCE_NOT_FOUND("Không tìm thấy tài liệu học tập"),
    ACHIEVEMENT_NOT_FOUND("Không tìm thấy thành tích"),
    ITEM_ALREADY_SAVED("Mục này đã được lưu trước đó"),
    SAVED_ITEM_NOT_FOUND("Không tìm thấy mục đã lưu"),

    // Mentorship module
    MENTOR_PROFILE_NOT_FOUND("Không tìm thấy hồ sơ mentor"),
    MENTOR_PROFILE_ALREADY_EXISTS("Hồ sơ mentor đã tồn tại"),
    EXPERTISE_NOT_FOUND("Không tìm thấy chuyên môn"),
    AVAILABILITY_NOT_FOUND("Không tìm thấy lịch trống"),
    AVAILABILITY_NOT_AVAILABLE("Lịch trống không khả dụng"),
    SESSION_NOT_FOUND("Không tìm thấy buổi mentoring"),
    SESSION_ALREADY_CANCELLED("Buổi mentoring đã được hủy trước đó"),
    SESSION_NOT_COMPLETED("Buổi mentoring chưa hoàn thành"),
    FEEDBACK_ALREADY_EXISTS("Đánh giá đã tồn tại"),

    // Forum module
    FORUM_CATEGORY_NOT_FOUND("Không tìm thấy danh mục forum"),
    FORUM_TOPIC_NOT_FOUND("Không tìm thấy chủ đề forum"),
    FORUM_POST_NOT_FOUND("Không tìm thấy bài viết forum"),
    INVALID_TOPIC_ID("ID chủ đề không hợp lệ"),

    // Fund module
    FUND_NOT_FOUND("Không tìm thấy quỹ"),
    ORGANIZATION_NOT_FOUND("Không tìm thấy organization"),
    FUND_STATUS_NOT_FOUND("Không tìm thấy trạng thái quỹ"),
    FUND_RECEIVING_INFO_NOT_FOUND("Không tìm thấy thông tin tài khoản đích"),
    FUND_INVALID_TIME_RANGE("Khoảng thời gian quỹ không hợp lệ"),
    FUND_ALREADY_ENDED("Quỹ đã kết thúc, không thể chỉnh sửa"),
    FUND_START_TIME_UPDATE_NOT_ALLOWED("Quỹ đang diễn ra, không thể sửa thời gian bắt đầu"),
    FUND_TARGET_AMOUNT_UPDATE_NOT_ALLOWED("Quỹ đang diễn ra, không thể sửa mục tiêu quỹ"),
    FUND_RECEIVING_INFO_UPDATE_NOT_ALLOWED("Quỹ đang diễn ra, không thể sửa tài khoản nhận quỹ"),
    FUND_TIME_TOO_EARLY("Thời gian chỉnh sửa phải từ hiện tại + 10 phút"),
    ERROR_EXTRACTING_MEMBERID_FROM_TOKEN("Co loi trong qua trinh extract memberId tu token"),
    NOT_FOUND_MEMBERID("Khong tim thay memberId trong token");

    private final String message;

    ErrorCode(String message) {
        this.message = message;
    }
}
