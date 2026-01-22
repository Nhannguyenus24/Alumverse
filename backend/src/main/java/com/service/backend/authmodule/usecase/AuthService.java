package com.service.backend.authmodule.usecase;

import com.service.backend.authmodule.domain.entity.User;
import com.service.backend.authmodule.domain.entity.GlobalProfile;
import com.service.backend.authmodule.domain.entity.GlobalIdentityVerification;
import com.service.backend.authmodule.domain.repository.IAuthRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

import com.service.backend.authmodule.presentation.dto.LoginRequest;
import com.service.backend.authmodule.presentation.dto.LoginResponse;


/**
 * Service layer for authentication and authorization operations
 */
public interface AuthService {
    Mono<Void> register(RegisterRequest req);

    Mono<LoginResponse> login(LoginRequest req);
}
