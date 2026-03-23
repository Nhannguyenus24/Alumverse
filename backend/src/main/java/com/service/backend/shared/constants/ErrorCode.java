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
    EMAIL_ALREADY_REGISTERED("Email already registered"),
    USERNAME_ALREADY_EXISTS("Username already exists"),
    INVALID_CREDENTIALS("Invalid email or password"),
    INVALID_USERNAME_CREDENTIALS("Invalid username or password"),
    INVALID_OLD_PASSWORD("Invalid old password"),
    OTP_EXPIRED_NOT_FOUND("OTP expired or not found"),
    INVALID_OTP("Invalid OTP"),
    REFRESH_TOKEN_NOT_FOUND("Refresh token not found"),
    INVALID_REFRESH_TOKEN("Invalid or expired refresh token"),

    // Event module
    EVENT_NOT_FOUND("Không tìm thấy sự kiện"),
    TICKET_NOT_FOUND("Không tìm thấy vé"),
    EVENT_FULLY_BOOKED("Sự kiện đã hết chỗ"),
    ALREADY_INTERESTED("Bạn đã đăng ký quan tâm sự kiện này"),
    TICKET_ALREADY_CANCELLED("Vé đã được hủy trước đó"),
    TICKET_ALREADY_CHECKED_IN("Vé đã được check-in"),

    // Article module
    NEWS_NOT_FOUND("Không tìm thấy tin tức"),
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
    INVALID_TOPIC_ID("ID chủ đề không hợp lệ");

    private final String message;

    ErrorCode(String message) {
        this.message = message;
    }
}
