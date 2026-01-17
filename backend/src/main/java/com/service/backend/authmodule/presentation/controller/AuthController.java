package com.service.backend.authmodule.presentation.controller;

import com.service.backend.authmodule.usecase.AuthService;
import com.service.backend.authmodule.domain.entity.User;
import com.service.backend.authmodule.domain.entity.GlobalProfile;
import com.service.backend.authmodule.domain.entity.GlobalIdentityVerification;
import com.service.backend.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * REST Controller for authentication and authorization operations
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
}
