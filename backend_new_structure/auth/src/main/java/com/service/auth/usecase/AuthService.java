package com.service.auth.usecase;

import com.service.auth.presentation.dto.LoginRequest;
import com.service.auth.presentation.dto.LoginResponse;
import com.service.auth.presentation.dto.RegisterRequest;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

/**
 * Service layer for authentication and authorization operations
 */
public interface AuthService {
    Mono<Void> register(RegisterRequest req);

    Mono<LoginResponse> login(LoginRequest req);

}
