package com.service.backend.auth.presentation.controller;

import com.service.backend.auth.presentation.dto.LoginRequest;
import com.service.backend.auth.presentation.dto.LoginResponse;
import com.service.backend.auth.presentation.dto.RegisterRequest;
import com.service.backend.auth.usecase.AuthService;
import com.service.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * REST Controller for authentication and authorization operations
 */
@RestController
@RequestMapping("/auth/api/authentication")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;


    @PostMapping("/register")
    public Mono<ResponseEntity<?>> register(@RequestBody @Valid RegisterRequest request) {
        return authService.register(request)
                .then(Mono.just(
                        ResponseEntity.ok(new ApiResponse<>(
                                "Registration successful. Please check your email to verify your account.",
                                null))));
    }

    @PostMapping("/login")
    public Mono<ResponseEntity<?>> login(
            @Valid @RequestBody LoginRequest req,
            ServerHttpResponse res)
    {
        return authService.login(req)
                .map(token -> {
                    ResponseCookie cookie = ResponseCookie.from("tdt", token.getRefreshToken())
                            .httpOnly(true)
                            .path("/")
                            .maxAge(Duration.ofDays(7))
                            .build();

                    res.addCookie(cookie);

                    return ResponseEntity
                            .status(200)
                            .body(new ApiResponse<>("Login successfully", token.getAccessToken()));
                });
    }

}
