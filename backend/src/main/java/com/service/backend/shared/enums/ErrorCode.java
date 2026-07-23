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
    EMAIL_ALREADY_EXISTS("Email đã được sử dụng bởi một tài khoản khác", 409),
    STUDENT_ID_ALREADY_EXISTS("Mã số sinh viên này đã được sử dụng trong tổ chức", 409),
    INVALID_CREDENTIALS("Invalid email or password", 401),
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
    RECAPTCHA_VERIFICATION_FAILED("ReCAPTCHA verification failed", 401),
    INTERNAL_SERVER_ERROR("Internal server error", 500),
    BAD_REQUEST("Bad request", 400),
    TOO_MANY_REQUESTS("Quá nhiều yêu cầu, vui lòng thử lại sau", 429),

    // Event module
    EVENT_NOT_FOUND("Không tìm thấy sự kiện", 404),
    TICKET_NOT_FOUND("Không tìm thấy vé", 404),
    EVENT_FULLY_BOOKED("Sự kiện đã hết chỗ", 400),
    ALREADY_INTERESTED("Bạn đã đăng ký quan tâm sự kiện này", 409),
    TICKET_ALREADY_CANCELLED("Vé đã được hủy trước đó", 400),
    TICKET_ALREADY_CHECKED_IN("Vé đã được check-in", 400),
    TICKET_NOT_ACTIVE("Vé chưa ở trạng thái Active để check-in", 400),
    TICKET_EXPIRED("Vé đã hết hạn", 400),
    TICKET_NOT_PENDING("Vé không ở trạng thái chờ duyệt", 400),
    TICKET_ALREADY_REGISTERED("Bạn đã đăng ký sự kiện này rồi", 409),
    EVENT_REGISTRATION_BANNED("Bạn đã bị cấm tham gia sự kiện này", 403),
    TICKET_REASON_REQUIRED("Vui lòng nhập lý do", 400),
    INVITATION_NOT_FOUND("Không tìm thấy lời mời", 404),
    INVITATION_EXPIRED("Lời mời đã hết hạn", 400),
    INVITATION_ALREADY_USED("Lời mời đã được sử dụng", 409),
    NO_TICKETS_TO_ISSUE("Không có vé nào để phát hành", 400),
    EVENT_REGISTRATION_ANSWER_INVALID("Câu trả lời đăng ký không hợp lệ", 400),
    EVENT_NOT_PUBLISHED("Sự kiện chưa được công bố", 400),
    EVENT_REGISTRATION_NOT_OPEN("Sự kiện chưa mở đăng ký", 400),
    EVENT_REGISTRATION_CLOSED("Sự kiện đã đóng đăng ký", 400),
    CANCEL_REASON_REQUIRED("Vui lòng nhập lý do huỷ vé", 400),
    TICKET_WRONG_EVENT("Vé không thuộc sự kiện này", 400),
    TICKET_QR_INVALID("Mã QR không hợp lệ", 400),
    TICKET_QR_EXPIRED("Mã QR đã hết hạn", 400),
    EVENT_COMMENT_NOT_FOUND("Không tìm thấy bình luận sự kiện", 404),

    // Article module
    NEWS_NOT_FOUND("Không tìm thấy tin tức", 404),
    ALUMNI_POST_NOT_FOUND("Không tìm thấy bài viết cựu sinh viên", 404),
    JOB_NOT_FOUND("Không tìm thấy việc làm", 404),
    LEARNING_RESOURCE_NOT_FOUND("Không tìm thấy tài liệu học tập", 404),
    ACHIEVEMENT_NOT_FOUND("Không tìm thấy thành tích", 404),
    ITEM_ALREADY_SAVED("Mục này đã được lưu trước đó", 409),
    SAVED_ITEM_NOT_FOUND("Không tìm thấy mục đã lưu", 404),
    NEWS_COMMENT_NOT_FOUND("Không tìm thấy bình luận tin tức", 404),
    ALUMNI_POST_COMMENT_NOT_FOUND("Không tìm thấy bình luận bài viết cựu sinh viên", 404),

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
    SESSION_SELF_BOOKING_NOT_ALLOWED("Bạn không thể đặt lịch với chính mình", 400),
    FEEDBACK_ALREADY_EXISTS("Đánh giá đã tồn tại", 409),
    SESSION_NOT_JOINABLE("Buổi mentoring không ở trạng thái có thể tham gia", 400),
    JOIN_TOO_EARLY("Chưa đến giờ tham gia buổi mentoring", 400),
    JOIN_WINDOW_CLOSED("Đã quá giờ tham gia buổi mentoring", 400),
    MEETING_LINK_NOT_CONFIGURED("Cố vấn chưa cấu hình link tham gia cho buổi này", 400),
    REPORT_NOT_ALLOWED_STATUS("Chỉ có thể báo cáo buổi đã hoàn thành hoặc không diễn ra", 400),
    REPORT_ALREADY_EXISTS("Bạn đã báo cáo buổi mentoring này rồi", 409),
    REPORT_REASON_REQUIRED("Vui lòng chọn lý do báo cáo hợp lệ", 400),
    REPORT_DESCRIPTION_REQUIRED("Vui lòng nhập mô tả chi tiết (tối thiểu 10 ký tự)", 400),

    // Forum module
    FORUM_CATEGORY_NOT_FOUND("Không tìm thấy danh mục forum", 404),
    FORUM_TOPIC_NOT_FOUND("Không tìm thấy chủ đề forum", 404),
    FORUM_POST_NOT_FOUND("Không tìm thấy bài viết forum", 404),
    FORUM_REPORT_NOT_FOUND("Không tìm thấy báo cáo forum", 404),
    INVALID_TOPIC_ID("ID chủ đề không hợp lệ", 400),
    FORUM_TOPIC_LOCKED("Chủ đề đã bị khóa", 400),
    FORUM_INVALID_STATUS("Trạng thái forum không hợp lệ", 400),

    // Education change request module
    EDUCATION_REQUEST_NOT_FOUND("Không tìm thấy yêu cầu thay đổi học vấn", 404),
    EDUCATION_REQUEST_ALREADY_PENDING("Đã có yêu cầu thay đổi học vấn đang chờ duyệt", 409),
    EDUCATION_REQUEST_FORBIDDEN("Bạn không có quyền thực hiện thao tác này với yêu cầu học vấn", 403),

    // Fund module
    FUND_NOT_FOUND("Không tìm thấy quỹ", 404),
    ORGANIZATION_NOT_FOUND("Không tìm thấy organization", 404),
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
    CONVERSATION_REQUEST_SEARCH_STATUS_NOT_ALLOWED(
            "Không thể lọc yêu cầu theo trạng thái ACCEPTED; vui lòng dùng tab Kết nối hiện tại",
            400),
    CHAT_USER_NOT_GROUP_MEMBER("Bạn không phải thành viên của nhóm chat này", 403),
    GROUP_MEMBER_LIMIT_EXCEEDED("Nhóm chat chỉ được phép tối đa 10 thành viên", 400),
    CANNOT_BLOCK_SELF("Bạn không thể chặn chính mình", 400),
    USER_ALREADY_BLOCKED("Bạn đã chặn thành viên này rồi", 409),
    USER_NOT_BLOCKED("Bạn chưa chặn thành viên này", 404),
    USER_COMMUNICATION_BLOCKED("Bạn không thể giao tiếp khi đang có chặn hoạt động", 403),
    USER_BLOCK_RELATIONSHIP_EXISTS("Đã tồn tại block giữa hai thành viên này", 403),

    // Survey module
    SURVEY_NOT_FOUND("Không tìm thấy khảo sát", 404),
    SURVEY_NOT_EDITABLE("Không thể chỉnh sửa khảo sát khi đã mở hoặc đã đóng", 400),
    SURVEY_NOT_OPEN("Khảo sát chưa mở hoặc đã đóng", 400),
    SURVEY_ALREADY_SUBMITTED("Bạn đã hoàn thành khảo sát này rồi", 409),
    SURVEY_ANSWER_INVALID("Câu trả lời khảo sát không hợp lệ", 400),
    SURVEY_INVALID_TIME_RANGE("Khoảng thời gian khảo sát không hợp lệ", 400);

    private final String message;
    private final int status;

    ErrorCode(String message, int status) {
        this.message = message;
        this.status = status;
    }
}
