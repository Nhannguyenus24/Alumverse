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

import com.service.backend.auth.dto.ChangePasswordRequest;
import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.auth.dto.LoginResponse;
import com.service.backend.auth.dto.RegisterRequest;
import com.service.backend.auth.dto.SendOtpRequest;
import com.service.backend.auth.dto.VerifyOtpRequest;
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
        return authService.register(request.getEmail(), request.getUserName(), request.getPassword())
                .map(ignore -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("User registered successfully", true)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(error.getMessage(), false))));
    }

    /**
     * Login user by email and password
     * Returns access token in response body and refresh token in HTTP-only cookie
     */
    @PostMapping("/login")
    public Mono<ResponseEntity<ApiResponse<LoginResponse>>> login(
            @Valid @RequestBody LoginRequest request) {
        return authService.loginByEmail(request.getEmail(), request.getPassword())
                .switchIfEmpty(Mono.defer(() -> 
                    authService.loginByUserName(request.getEmail(), request.getPassword())
                ))
                .map(user -> {
                    String accessToken = jwtUtils.generateAccessToken(
                            user.getId(),
                            user.getEmail(),
                            user.getRole().name(),
                            user.getUserName(),
                            user.getAvatarUrl()
                    );
                    String refreshToken = jwtUtils.generateRefreshToken(user.getId());

                    ResponseCookie refreshTokenCookie = ResponseCookie
                            .from("refreshToken", refreshToken)
                            .httpOnly(true)
                            // .secure(true) // turn on when in https
                            .maxAge(Duration.ofDays(7))
                            .sameSite("Lax")
                            .build();

                    LoginResponse loginResponse = LoginResponse.builder()
                            .accessToken(accessToken)
                            .build();

                    return ResponseEntity.ok()
                            .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                            .body(new ApiResponse<>("Login successful", loginResponse));
                })
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Activate user after successful verification
     */
    @PostMapping("/activate/{userId}")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> activateUser(
            @PathVariable @Min(value = 1, message = "User ID must be greater than 0") Integer userId) {
        return authService.activateUser(userId)
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("User activated successfully", true))))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), false))));
    }

    /**
     * Change user password
     */
    @PutMapping("/password/{userId}")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> changePassword(
            @PathVariable @Min(value = 1, message = "User ID must be greater than 0") Integer userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        return authService.changePassword(userId, request.getOldPassword(), request.getNewPassword())
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("Password changed successfully", true))))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(error.getMessage(), false))));
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
                .map(accessToken -> {
                    LoginResponse loginResponse = LoginResponse.builder()
                            .accessToken(accessToken)
                            .build();

                    return ResponseEntity.ok(new ApiResponse<>("Access token refreshed successfully", loginResponse));
                })
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Send OTP verification code to user's email
     */
    @PostMapping("/send-otp")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> sendOtp(
            @Valid @RequestBody SendOtpRequest request) {
        return authService.sendOtpVerification(request.getEmail())
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("OTP sent successfully", true))))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(error.getMessage(), false))));
    }

    /**
     * Verify OTP code and activate user account
     */
    @PostMapping("/verify-otp")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        return authService.verifyOtpAndActivate(request.getEmail(), request.getOtp())
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("OTP verified and account activated successfully", true))))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(error.getMessage(), false))));
    }
}
