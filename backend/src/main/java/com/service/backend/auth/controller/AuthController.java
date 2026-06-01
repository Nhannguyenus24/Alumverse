package com.service.backend.auth.controller;

import java.time.Duration;

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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import io.swagger.v3.oas.annotations.Parameter;
import com.service.backend.auth.dto.ChangePasswordRequest;
import com.service.backend.auth.dto.GoogleLoginRequest;
import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.auth.dto.LoginResponse;
import com.service.backend.auth.dto.RegisterRequest;
import com.service.backend.auth.dto.SendOtpRequest;
import com.service.backend.auth.dto.VerifyOtpRequest;
import com.service.backend.auth.entity.User;
import com.service.backend.auth.service.AuthService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.utils.JwtUtils;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {
    private final AuthService authService;
    private final JwtUtils jwtUtils;

    public AuthController(AuthService authService, JwtUtils jwtUtils) {
        this.authService = authService;
        this.jwtUtils = jwtUtils;
    }

    /**
     * Register a new user
     */
    @PostMapping("/register")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> register(
            @Valid @RequestBody RegisterRequest request) {
        return authService.register(request.getEmail(), request.getUserName(), request.getPassword(), request.getFullName(), request.getOrganizationId())
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

        return authService.loginByEmail(request.getEmail(), request.getPassword(), request.getOrganizationId(), userAgent, loginIp)
                .switchIfEmpty(Mono.defer(() ->
                    authService.loginByUserName(request.getEmail(), request.getPassword(), request.getOrganizationId(), userAgent, loginIp)
                ))
                .flatMap(user -> buildLoginResponse(user, request.getOrganizationId()));
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
                .flatMap(user -> buildLoginResponse(user, request.getOrganizationId()));
    }

    /**
     * Activate user after successful verification
     */
    @PostMapping("/activate/{userId}")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> activateUser(
            @Parameter(example = "123")
            @PathVariable @Min(value = 1, message = "User ID must be greater than 0") Integer userId) {
        return authService.activateUser(userId)
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("User activated successfully", true)));
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
     * Logout user - remove refresh token cookie
     */
    @PostMapping("/logout")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> logout() {
        // Create empty refresh token cookie with maxAge 0 to remove it
        ResponseCookie refreshTokenCookie = ResponseCookie
                .from("refreshToken", "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        return Mono.just(ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(new ApiResponse<>("Logout successful", true)));
    }

    /**
     * Refresh access token using refresh token from cookie
     */
    @PostMapping("/refresh")
    public Mono<ResponseEntity<ApiResponse<LoginResponse>>> refresh(
            @CookieValue(value = "refreshToken", required = false) String refreshToken) {
        
        return authService.refreshAccessToken(refreshToken)
                .map(loginResponse -> ResponseEntity.ok(
                        new ApiResponse<>("Access token refreshed successfully", loginResponse)));
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

    private Mono<ResponseEntity<ApiResponse<LoginResponse>>> buildLoginResponse(User user, Integer organizationId) {
        if (organizationId == null) {
            // For admin login without organization, generate token with null orgId
            String accessToken = jwtUtils.generateAccessToken(
                    user.getId(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getUserName(),
                    user.getAvatarUrl(),
                    null
            );
            String refreshToken = jwtUtils.generateRefreshToken(user.getId(), null);

            ResponseCookie refreshTokenCookie = ResponseCookie
                    .from("refreshToken", refreshToken)
                    .httpOnly(true)
                    // .secure(true) // turn on when in https
                    .path("/")
                    .maxAge(Duration.ofDays(7))
                    .sameSite("Lax")
                    .build();

            LoginResponse loginResponse = LoginResponse.builder()
                    .accessToken(accessToken)
                    .verificationLevel(1) // Default for system admin (non-zero)
                    .build();

            return Mono.just(ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                    .body(new ApiResponse<>("Login successful", loginResponse)));
        }

        return authService.getVerificationLevel(user.getId(), organizationId)
                .defaultIfEmpty(0) // If user is not a member, level is 0
                .map(level -> {
                    String accessToken = jwtUtils.generateAccessToken(
                            user.getId(),
                            user.getEmail(),
                            user.getRole().name(),
                            user.getUserName(),
                            user.getAvatarUrl(),
                            organizationId
                    );
                    String refreshToken = jwtUtils.generateRefreshToken(user.getId(), organizationId);

                    ResponseCookie refreshTokenCookie = ResponseCookie
                            .from("refreshToken", refreshToken)
                            .httpOnly(true)
                            // .secure(true) // turn on when in https
                            .path("/")
                            .maxAge(Duration.ofDays(7))
                            .sameSite("Lax")
                            .build();

                    LoginResponse loginResponse = LoginResponse.builder()
                            .accessToken(accessToken)
                            .verificationLevel(level)
                            .build();

                    return ResponseEntity.ok()
                            .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                            .body(new ApiResponse<>("Login successful", loginResponse));
                });
    }
}
