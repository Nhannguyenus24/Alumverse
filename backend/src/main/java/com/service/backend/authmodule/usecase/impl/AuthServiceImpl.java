package com.service.backend.authmodule.usecase.impl;

import com.service.backend.authmodule.domain.entity.GlobalProfile;
import com.service.backend.authmodule.domain.entity.OtpCode;
import com.service.backend.authmodule.domain.entity.User;
import com.service.backend.authmodule.domain.repository.IGlobalProfileRepository;
import com.service.backend.authmodule.domain.repository.IOtpCodeRepository;
import com.service.backend.authmodule.domain.repository.IUserRepository;
import com.service.backend.authmodule.presentation.dto.LoginRequest;
import com.service.backend.authmodule.presentation.dto.LoginResponse;
import com.service.backend.authmodule.presentation.dto.RegisterRequest;
import com.service.backend.authmodule.usecase.AuthService;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import com.service.backend.shared.mail.EmailService;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final IUserRepository userRepository;
    //private final IGlobalProfileRepository globalProfileRepository;
    //private final IOtpCodeRepository otpCodeRepository;
    //private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Mono<Void> register(RegisterRequest req) {
        return this.userRepository.existsByEmail(req.getEmail())
                .filter(exists -> !exists)
                .switchIfEmpty(
                        Mono.error(new ApplicationException(
                                ErrorCode.RESOURCES_DUPLICATE,
                                "Email is already used by another account"
                        ))
                )
                .flatMap(exists -> {
                            User user = User.builder()
                                    .email(req.getEmail())
                                    .passwordHash(this.passwordEncoder
                                            .encode(req.getPassword()))
                                    .isActive(false)
                                    .build();

                            return this.userRepository.save(user);
                        })
                .then();
    }

    @Override
    public Mono<LoginResponse> login(LoginRequest req) {
        return userRepository.findByEmail(req.getEmail())
                .switchIfEmpty(Mono.error(
                        new ApplicationException(
                                ErrorCode.USER_NOT_FOUND,
                                "User is not found"
                        )
                ))
                .flatMap(user -> {

                        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
                            return Mono.error(
                                    new ApplicationException(
                                            ErrorCode.INVALID_PASSWORD,
                                            "password is invalid"
                                    )
                            );
                        }

                        String accessToken = jwtUtil.generateAccessToken(
                                user.getId().toString(),
                                "Not_implemented_business_logic_not_confirmed_:))"
                        );

                        String refreshToken = jwtUtil.generateRefreshToken(
                                user.getId().toString()
                        );

                        RefreshToken refreshTokenObject = RefreshToken.builder()
                                .userId(user.getId())
                                .token(refreshToken)
                                .expiresAt(LocalDateTime.now().plusDays(7))
                                .build();

                        return refreshTokenRepository.save(refreshTokenObject)
                                .thenReturn(
                                        new LoginResponse(accessToken, refreshToken)
                                );
                    });
    }
}
