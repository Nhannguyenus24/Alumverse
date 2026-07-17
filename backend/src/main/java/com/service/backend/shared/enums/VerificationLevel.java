package com.service.backend.shared.enums;

/**
 * Các mức của organization_members.verification_level.
 * Nhãn hiển thị tương ứng nằm ở i18n admin.json key "verification_level".
 */
public final class VerificationLevel {

    /** Chưa xác thực. */
    public static final int UNVERIFIED = 0;

    /** Đang xác minh - đã gửi yêu cầu và đang chờ duyệt. */
    public static final int VERIFYING = 1;

    /** Đã xác thực - cựu sinh viên (đã tốt nghiệp hoặc đã thôi học). */
    public static final int VERIFIED = 2;

    /** Sinh viên - thành viên đã xác thực và đang còn học. */
    public static final int STUDENT = 3;

    /** Quản trị viên. */
    public static final int ADMIN = 4;

    private VerificationLevel() {
    }
}
