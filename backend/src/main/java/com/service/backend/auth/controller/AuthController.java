package com.service.backend.auth.controller;

import java.time.Duration;

import com.service.backend.shared.enums.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import io.swagger.v3.oas.annotations.Parameter;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.auth.service.RecaptchaService;
import com.service.backend.auth.dto.ChangePasswordRequest;
import com.service.backend.auth.dto.GoogleLoginRequest;
import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.auth.dto.LoginResponse;
import com.service.backend.auth.dto.RegisterRequest;
import com.service.backend.auth.dto.SendOtpRequest;
import com.service.backend.auth.dto.VerifyOtpRequest;
import com.service.backend.auth.dto.ResetPasswordRequest;
import com.service.backend.auth.dto.VerifyOldEmailOtpRequest;
import com.service.backend.shared.entity.User;
import com.service.backend.auth.service.AuthService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Value;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import reactor.core.publisher.Mono;
import com.service.backend.shared.annotations.PublicEndpoint;
import com.service.backend.shared.annotations.PrivateEndpoint;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;

@PublicEndpoint
@Tag(name = "Auth", description = "API endpoints for user authentication and authorization")
@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final JwtUtils jwtUtils;
    private final RecaptchaService recaptchaService;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    public AuthController(AuthService authService, JwtUtils jwtUtils, RecaptchaService recaptchaService) {
        this.authService = authService;
        this.jwtUtils = jwtUtils;
        this.recaptchaService = recaptchaService;
    }

    private ResponseCookie buildRefreshTokenCookie(String value, long maxAgeMs) {
        return ResponseCookie.from("refreshToken", value)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(Duration.ofMillis(maxAgeMs))
                .sameSite(cookieSecure ? "None" : "Lax")
                .build();
    }

    /**
     * Register a new user
     */
    @PostMapping("/register")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> register(
            @Valid @RequestBody RegisterRequest request) {
        return authService.register(request.getEmail(), request.getPassword(), request.getFullName(), request.getOrganizationId())
                .then(authService.sendOtpVerification(request.getEmail()))
                .thenReturn(ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("User registered successfully", true)));
    }

    /**
     * Login user
     * Returns access token in response body and refresh token in HTTP-only cookie
     */
    @PostMapping("/login")
    public Mono<ResponseEntity<ApiResponse<LoginResponse>>> login(
            @Valid @RequestBody LoginRequest request,
            ServerWebExchange exchange) {
        String userAgent = extractUserAgent(exchange);
        String loginIp = extractRemoteAddress(exchange);

        return recaptchaService.verifyRecaptcha(request.getRecaptchaToken())
                .flatMap(isValid -> {
                    if (!isValid) {
                        return Mono.error(new ApplicationException(ErrorCode.RECAPTCHA_VERIFICATION_FAILED));
                    }
                    return authService.loginByEmail(request.getEmail(), request.getPassword(), request.getOrganizationId(), userAgent, loginIp)
                            .flatMap(user -> buildLoginResponse(user, request.getOrganizationId(), request.isRememberMe()));
                });
    }

    /**
     * Login user with Google ID token
     */
    @PostMapping("/google-login")
    public Mono<ResponseEntity<ApiResponse<LoginResponse>>> googleLogin(
            @Valid @RequestBody GoogleLoginRequest request,
            ServerWebExchange exchange) {
        String userAgent = extractUserAgent(exchange);
        String loginIp = extractRemoteAddress(exchange);

        return authService.loginWithGoogle(request.getIdToken(), request.getOrganizationId(), userAgent, loginIp)
                .flatMap(user -> buildLoginResponse(user, request.getOrganizationId(), request.isRememberMe()));
    }

    /**
     * Activate user after successful verification — ADMIN only
     */
    @PrivateEndpoint
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/activate/{userId}")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> activateUser(
            @Parameter(example = "123")
            @PathVariable @Min(value = 1, message = "User ID must be greater than 0") Integer userId) {
        return authService.activateUser(userId)
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("User activated successfully", true)));
    }

    /**
     * Reset password using OTP (forgot password flow — no old password required)
     */
    @PostMapping("/reset-password")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPasswordWithOtp(request.getEmail(), request.getOtp(), request.getNewPassword())
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("Password reset successfully", true)));
    }

    /**
     * Change user password
     */
    @PutMapping("/password/{userId}")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> changePassword(
            @Parameter(example = "123")
            @PathVariable @Min(value = 1, message = "User ID must be greater than 0") Integer userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        return authService.changePassword(userId, request.getOldPassword(), request.getNewPassword())
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("Password changed successfully", true)));
    }

    /**
     * Logout user - revoke refresh token and clear cookie
     */
    @PostMapping("/logout")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> logout(
            @CookieValue(value = "refreshToken", required = false) String refreshToken) {
        if (org.springframework.util.StringUtils.hasText(refreshToken)) {
            jwtUtils.revokeRefreshToken(refreshToken);
        }

        // Must mirror the attributes of the cookie set in buildRefreshTokenCookie
        // (Secure + SameSite) so the browser matches and actually deletes it.
        ResponseCookie clearCookie = buildRefreshTokenCookie("", 0);

        return Mono.just(ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(new ApiResponse<>("Logout successful", true)));
    }

    /**
     * Revoke refresh token without clearing cookie (explicit revoke API)
     */
    @PostMapping("/revoke")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> revoke(
            @CookieValue(value = "refreshToken", required = false) String refreshToken) {
        if (org.springframework.util.StringUtils.hasText(refreshToken)) {
            jwtUtils.revokeRefreshToken(refreshToken);
        }
        return Mono.just(ResponseEntity.ok(new ApiResponse<>("Token revoked successfully", true)));
    }

    /**
     * Refresh access token using refresh token from cookie
     */
    @PostMapping("/refresh")
    public Mono<ResponseEntity<ApiResponse<LoginResponse>>> refresh(
            @Parameter(example = "1")
            @RequestParam(value = "organizationId", required = false) Integer organizationId,
            @CookieValue(value = "refreshToken", required = false) String refreshToken) {

        logger.info("/auth/refresh called — organizationId: {}, refreshToken cookie present: {}",
                organizationId, org.springframework.util.StringUtils.hasText(refreshToken));

        return authService.refreshAccessToken(refreshToken, organizationId)
                .map(loginResponse -> ResponseEntity.ok(
                        new ApiResponse<>("Access token refreshed successfully", loginResponse)));
    }

    /**
     * Switch organization - issues a new access token for the specified organization.
     * The refresh token is left untouched (it carries only the user identity); the cookie
     * is not rotated, so concurrent /auth/refresh calls keep working.
     */
    @PostMapping("/switch-organization/{organizationId}")
    public Mono<ResponseEntity<ApiResponse<LoginResponse>>> switchOrganization(
            @Parameter(example = "1")
            @PathVariable @Min(value = 1, message = "Organization ID must be greater than 0") Integer organizationId,
            @CookieValue(value = "refreshToken", required = false) String refreshToken) {

        return authService.switchOrganization(refreshToken, organizationId)
                .doOnError(err -> logger.warn("/auth/switch-organization/{} failed: {}", organizationId, err.getMessage()))
                .map(tuple -> {
                    String newAccessToken = tuple.getT1();
                    Integer verificationLevel = tuple.getT2();

                    LoginResponse loginResponse = LoginResponse.builder()
                            .accessToken(newAccessToken)
                            .verificationLevel(verificationLevel)
                            .build();

                    return ResponseEntity.ok(new ApiResponse<>("Switched organization successfully", loginResponse));
                });
    }

    /**
     * Send OTP verification code to user's email
     */
    @PostMapping("/send-otp")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> sendOtp(
            @Valid @RequestBody SendOtpRequest request) {
        return authService.sendOtpVerification(request.getEmail())
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("OTP sent successfully", true)));
    }

    /**
     * Verify OTP code and activate user account
     */
    @PostMapping("/verify-otp")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        return authService.verifyOtpAndActivate(request.getEmail(), request.getOtp())
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("OTP verified and account activated successfully", true)));
    }

    /**
     * Request OTP to change email (sent to old email)
     */
    @PostMapping("/change-email/{userId}/request-otp-old")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> requestChangeEmailOtpOld(
            @Parameter(example = "123")
            @PathVariable @Min(value = 1, message = "User ID must be greater than 0") Integer userId) {
        return authService.requestChangeEmailOtpOld(userId)
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("OTP sent to old email successfully", true)));
    }

    /**
     * Verify OTP sent to old email for changing email
     */
    @PostMapping("/change-email/{userId}/verify-otp-old")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> verifyChangeEmailOtpOld(
            @Parameter(example = "123")
            @PathVariable @Min(value = 1, message = "User ID must be greater than 0") Integer userId,
            @Valid @RequestBody VerifyOldEmailOtpRequest request) {
        return authService.verifyChangeEmailOtpOld(userId, request.getOtp())
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("Old email verified successfully", true)));
    }

    /**
     * Request OTP to new email
     */
    @PostMapping("/change-email/{userId}/request-otp-new")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> requestChangeEmailOtpNew(
            @Parameter(example = "123")
            @PathVariable @Min(value = 1, message = "User ID must be greater than 0") Integer userId,
            @Valid @RequestBody SendOtpRequest request) {
        return authService.requestChangeEmailOtpNew(userId, request.getEmail())
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("OTP sent to new email successfully", true)));
    }

    /**
     * Verify OTP sent to new email and update email
     */
    @PostMapping("/change-email/{userId}/verify-otp-new")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> verifyChangeEmailOtpNew(
            @Parameter(example = "123")
            @PathVariable @Min(value = 1, message = "User ID must be greater than 0") Integer userId,
            @Valid @RequestBody VerifyOtpRequest request) {
        return authService.verifyChangeEmailOtpNew(userId, request.getEmail(), request.getOtp())
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("Email updated successfully", true)));
    }

    private String extractUserAgent(ServerWebExchange exchange) {
        String userAgent = exchange.getRequest().getHeaders().getFirst(HttpHeaders.USER_AGENT);
        return userAgent != null ? userAgent : "Unknown";
    }

    private String extractRemoteAddress(ServerWebExchange exchange) {
        String remoteAddress = null;

        // Try to get from X-Forwarded-For header first (for proxy/load balancer)
        String xForwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            remoteAddress = xForwardedFor.split(",")[0].trim();
        }

        // If not found, get from remote address
        if (remoteAddress == null && exchange.getRequest().getRemoteAddress() != null) {
            remoteAddress = exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
        }

        return remoteAddress != null ? remoteAddress : "Unknown";
    }

    private Mono<ResponseEntity<ApiResponse<LoginResponse>>> buildLoginResponse(User user, Integer organizationId, boolean rememberMe) {
        long refreshTokenExpirationMs = rememberMe ? 2592000000L : 604800000L; // 30 days vs 7 days

        if (user.getRole() == UserRole.ADMIN) {
            // For admin login, generate token with null orgId
            String accessToken = jwtUtils.generateAccessToken(user, null, 4);
            String refreshToken = jwtUtils.generateRefreshToken(user.getId(), refreshTokenExpirationMs);

            ResponseCookie refreshTokenCookie = buildRefreshTokenCookie(refreshToken, refreshTokenExpirationMs);

            LoginResponse loginResponse = LoginResponse.builder()
                    .accessToken(accessToken)
                    .verificationLevel(4) // Default for system admin (non-zero)
                    .mustChangePassword(user.isMustChangePassword())
                    .build();

            return Mono.just(ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                    .body(new ApiResponse<>("Login successful", loginResponse)));
        }

        if (organizationId == null) {
            return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Organization ID is required for non-admin users"));
        }

        return authService.getEffectiveVerificationLevel(user, organizationId)
                .map(level -> {
                    String accessToken = jwtUtils.generateAccessToken(user, organizationId, level);
                    String refreshToken = jwtUtils.generateRefreshToken(user.getId(), refreshTokenExpirationMs);
                    ResponseCookie refreshTokenCookie = buildRefreshTokenCookie(refreshToken, refreshTokenExpirationMs);

                    LoginResponse loginResponse = LoginResponse.builder()
                            .accessToken(accessToken)
                            .verificationLevel(level)
                            .mustChangePassword(user.isMustChangePassword())
                            .build();

                    return ResponseEntity.ok()
                            .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                            .body(new ApiResponse<>("Login successful", loginResponse));
                });
    }
}
