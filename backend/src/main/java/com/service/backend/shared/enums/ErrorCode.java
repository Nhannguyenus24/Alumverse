package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum ErrorCode {
    RESOURCES_DUPLICATE("Tài nguyên đã tồn tại", 409),
    INVALID_PASSWORD("Mật khẩu không hợp lệ", 400),
    USER_NOT_FOUND("Không tìm thấy người dùng", 404),
    RESOURCES_NOT_FOUND("Không tìm thấy tài nguyên", 404),
    FORBIDDEN("Bạn không có quyền truy cập", 403),

    // Auth module
    EMAIL_OR_USERNAME_ALREADY_REGISTERED("Email or username already registered", 409),
    USERNAME_ALREADY_EXISTS("Username already exists", 409),
    INVALID_CREDENTIALS("Invalid email or password", 401),
    INVALID_USERNAME_CREDENTIALS("Invalid username or password", 401),
    INVALID_OLD_PASSWORD("Invalid old password", 400),
    OTP_EXPIRED_NOT_FOUND("OTP expired or not found", 404),
    INVALID_OTP("Invalid OTP", 400),
    ACCOUNT_NOT_VERIFIED("Account is not verified. Please verify your email with OTP.", 401),
    REFRESH_TOKEN_NOT_FOUND("Refresh token not found", 401),
    INVALID_REFRESH_TOKEN("Invalid or expired refresh token", 401),
    ACCESS_TOKEN_NOT_FOUND("Access token not found", 401),
    INVALID_ACCESS_TOKEN("Invalid or expired access token", 401),
    ERROR_SIGNING_JWT_TOKEN("Error signing JWT token", 500),
    ERROR_VALIDATE_JWT_TOKEN("Error validating JWT token", 401),
    USER_NOT_MEMBER_OF_ORGANIZATION("User is not a member of this organization", 403),
    GOOGLE_LOGIN_NOT_CONFIGURED("Google login is not configured", 500),
    GOOGLE_TOKEN_REQUIRED("Google ID token is required", 400),
    ORGANIZATION_ID_REQUIRED("Organization ID is required", 400),
    GOOGLE_TOKEN_INVALID("Google token is invalid", 401),
    GOOGLE_TOKEN_AUDIENCE_INVALID("Google token audience is invalid", 401),
    GOOGLE_TOKEN_ISSUER_INVALID("Google token issuer is invalid", 401),
    GOOGLE_EMAIL_NOT_VERIFIED("Google email is not verified", 401),
    GOOGLE_ACCOUNT_EMAIL_MISSING("Google account email is missing", 401),
    GOOGLE_LOGIN_NOT_ALLOWED("Account is not allowed to login with Google", 403),
    INTERNAL_SERVER_ERROR("Internal server error", 500),
    BAD_REQUEST("Bad request", 400),

    // Event module
    EVENT_NOT_FOUND("Không tìm thấy sự kiện", 404),
    TICKET_NOT_FOUND("Không tìm thấy vé", 404),
    EVENT_FULLY_BOOKED("Sự kiện đã hết chỗ", 400),
    ALREADY_INTERESTED("Bạn đã đăng ký quan tâm sự kiện này", 409),
    TICKET_ALREADY_CANCELLED("Vé đã được hủy trước đó", 400),
    TICKET_ALREADY_CHECKED_IN("Vé đã được check-in", 400),

    // Article module
    NEWS_NOT_FOUND("Không tìm thấy tin tức", 404),
    ALUMNI_POST_NOT_FOUND("Không tìm thấy bài viết cựu sinh viên", 404),
    JOB_NOT_FOUND("Không tìm thấy việc làm", 404),
    LEARNING_RESOURCE_NOT_FOUND("Không tìm thấy tài liệu học tập", 404),
    ACHIEVEMENT_NOT_FOUND("Không tìm thấy thành tích", 404),
    ITEM_ALREADY_SAVED("Mục này đã được lưu trước đó", 409),
    SAVED_ITEM_NOT_FOUND("Không tìm thấy mục đã lưu", 404),

    // Mentorship module
    MENTOR_PROFILE_NOT_FOUND("Không tìm thấy hồ sơ mentor", 404),
    MENTOR_PROFILE_ALREADY_EXISTS("Hồ sơ mentor đã tồn tại", 409),
    MENTEE_PROFILE_NOT_FOUND("Không tìm thấy hồ sơ mentee", 404),
    EXPERTISE_NOT_FOUND("Không tìm thấy chuyên môn", 404),
    AVAILABILITY_NOT_FOUND("Không tìm thấy lịch trống", 404),
    AVAILABILITY_NOT_AVAILABLE("Lịch trống không khả dụng", 400),
    AVAILABILITY_IN_PAST("Slot phải nằm trong tương lai", 400),
    AVAILABILITY_INVALID_RANGE("Giờ kết thúc phải sau giờ bắt đầu", 400),
    AVAILABILITY_OVERLAP("Slot trùng với một slot đã tồn tại", 409),
    SESSION_NOT_FOUND("Không tìm thấy buổi mentoring", 404),
    SESSION_ALREADY_CANCELLED("Buổi mentoring đã được hủy trước đó", 400),
    SESSION_NOT_COMPLETED("Buổi mentoring chưa hoàn thành", 400),
    FEEDBACK_ALREADY_EXISTS("Đánh giá đã tồn tại", 409),

    // Forum module
    FORUM_CATEGORY_NOT_FOUND("Không tìm thấy danh mục forum", 404),
    FORUM_TOPIC_NOT_FOUND("Không tìm thấy chủ đề forum", 404),
    FORUM_POST_NOT_FOUND("Không tìm thấy bài viết forum", 404),
    FORUM_REPORT_NOT_FOUND("Không tìm thấy báo cáo forum", 404),
    INVALID_TOPIC_ID("ID chủ đề không hợp lệ", 400),
    FORUM_TOPIC_LOCKED("Chủ đề đã bị khóa", 400),

    // Fund module
    FUND_NOT_FOUND("Không tìm thấy quỹ", 404),
    ORGANIZATION_NOT_FOUND("Không tìm thấy organization", 404),
    FUND_STATUS_NOT_FOUND("Không tìm thấy trạng thái quỹ", 404),
    FUND_RECEIVING_INFO_NOT_FOUND("Không tìm thấy thông tin tài khoản đích", 404),
    FUND_INVALID_TIME_RANGE("Khoảng thời gian quỹ không hợp lệ", 400),
    FUND_ALREADY_ENDED("Quỹ đã kết thúc, không thể chỉnh sửa", 400),
    FUND_START_TIME_UPDATE_NOT_ALLOWED("Quỹ đang diễn ra, không thể sửa thời gian bắt đầu", 400),
    FUND_TARGET_AMOUNT_UPDATE_NOT_ALLOWED("Quỹ đang diễn ra, không thể sửa mục tiêu quỹ", 400),
    FUND_RECEIVING_INFO_UPDATE_NOT_ALLOWED("Quỹ đang diễn ra, không thể sửa tài khoản nhận quỹ", 400),
    FUND_TIME_TOO_EARLY("Thời gian chỉnh sửa phải từ hiện tại + 10 phút", 400),
    ORGANIZATION_MEMBER_NOT_FOUND("Không tìm thấy thông tin thành viên tổ chức", 404),
    ERROR_EXTRACTING_MEMBERID_FROM_TOKEN("Co loi trong qua trinh extract memberId tu token", 401),
    NOT_FOUND_MEMBERID("Khong tim thay memberId trong token", 401),

    // Chat module
    CONVERSATION_REQUEST_NOT_FOUND("Không tìm thấy yêu cầu kết nối", 404),
    CONVERSATION_REQUEST_NOT_RECIPIENT("Chỉ người nhận yêu cầu mới có thể phản hồi", 403),
    CONVERSATION_REQUEST_NOT_PENDING("Yêu cầu kết nối không còn ở trạng thái chờ phản hồi", 409),
    CONVERSATION_REQUEST_ALREADY_PENDING("Yêu cầu kết nối đang chờ phản hồi từ phía kia", 409),
    CONVERSATION_REQUEST_ALREADY_ACCEPTED("Hai người đã kết nối với nhau rồi", 409),
    CONVERSATION_REQUEST_COOLDOWN_ACTIVE("Yêu cầu kết nối đã bị từ chối, vui lòng thử lại sau khi hết thời gian chờ", 429),
    CHAT_USER_NOT_GROUP_MEMBER("Bạn không phải thành viên của nhóm chat này", 403);

    private final String message;
    private final int status;

    ErrorCode(String message, int status) {
        this.message = message;
        this.status = status;
    }
}
