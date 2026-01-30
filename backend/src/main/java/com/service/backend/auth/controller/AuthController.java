package com.service.backend.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.service.backend.auth.dto.ChangePasswordRequest;
import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.auth.dto.RegisterRequest;
import com.service.backend.auth.entity.User;
import com.service.backend.auth.service.AuthService;
import com.service.backend.shared.dto.ApiResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Register a new user
     */
    @PostMapping("/register")
    public Mono<ResponseEntity<ApiResponse<User>>> register(
            @Valid @RequestBody RegisterRequest request) {
        return authService.register(request.getEmail(), request.getUserName(), request.getPassword())
                .map(user -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("User registered successfully", user)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Login user by email and password
     */
    @PostMapping("/login")
    public Mono<ResponseEntity<ApiResponse<User>>> login(
            @Valid @RequestBody LoginRequest request) {
        return authService.loginByEmail(request.getEmail(), request.getPassword())
                .map(user -> ResponseEntity.ok(new ApiResponse<>("Login successful", user)))
                .switchIfEmpty(Mono.defer(() -> 
                    authService.loginByUserName(request.getEmail(), request.getPassword())
                        .map(user -> ResponseEntity.ok(new ApiResponse<>("Login successful", user)))
                ))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Activate user after successful verification
     */
    @PostMapping("/activate/{userId}")
    public Mono<ResponseEntity<ApiResponse<Object>>> activateUser(
            @PathVariable @Min(value = 1, message = "User ID must be greater than 0") Integer userId) {
        return authService.activateUser(userId)
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("User activated successfully", null))))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Change user password
     */
    @PutMapping("/password/{userId}")
    public Mono<ResponseEntity<ApiResponse<Object>>> changePassword(
            @PathVariable @Min(value = 1, message = "User ID must be greater than 0") Integer userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        return authService.changePassword(userId, request.getOldPassword(), request.getNewPassword())
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("Password changed successfully", null))))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(error.getMessage(), null))));
    }
}
