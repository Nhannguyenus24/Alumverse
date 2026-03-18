package com.service.backend.auth.constants;

/**
 * Constants for Authentication Service
 */
public final class AuthConstants {
    
    // OTP Configuration
    public static final String OTP_CACHE_KEY = "otp_verification";
    public static final String OTP_EMAIL_SUBJECT = "Email Verification - OTP Code";
    public static final String OTP_EMAIL_TEMPLATE = "otpVerification";
    public static final String OTP_CACHE_OTP_FIELD = "otp";
    public static final String OTP_CACHE_USER_ID_FIELD = "userId";
    public static final int OTP_LENGTH = 6;
    public static final int OTP_MAX_VALUE = 1000000;
    
    // Error Messages
    public static final String ERROR_EMAIL_ALREADY_REGISTERED = "Email already registered";
    public static final String ERROR_USERNAME_ALREADY_EXISTS = "Username already exists";
    public static final String ERROR_INVALID_CREDENTIALS = "Invalid email or password";
    public static final String ERROR_INVALID_USERNAME_CREDENTIALS = "Invalid username or password";
    public static final String ERROR_USER_NOT_FOUND = "User not found";
    public static final String ERROR_INVALID_OLD_PASSWORD = "Invalid old password";
    public static final String ERROR_OTP_EXPIRED_NOT_FOUND = "OTP expired or not found";
    public static final String ERROR_INVALID_OTP = "Invalid OTP";
    public static final String ERROR_REFRESH_TOKEN_NOT_FOUND = "Refresh token not found";
    public static final String ERROR_INVALID_REFRESH_TOKEN = "Invalid or expired refresh token";
    
    private AuthConstants() {
        throw new AssertionError("Cannot instantiate constants class");
    }
}
