package com.service.backend.auth.usecase;

import com.service.backend.auth.presentation.dto.RegisterRequest;
import reactor.core.publisher.Mono;

import com.service.backend.auth.presentation.dto.LoginRequest;
import com.service.backend.auth.presentation.dto.LoginResponse;


/**
 * Service layer for authentication and authorization operations
 */
public interface AuthService {
    Mono<Void> register(RegisterRequest req);

    Mono<LoginResponse> login(LoginRequest req);
}
