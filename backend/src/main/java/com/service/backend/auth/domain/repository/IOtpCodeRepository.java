package com.service.backend.auth.domain.repository;

import com.service.backend.auth.domain.entity.OtpCode;
import reactor.core.publisher.Mono;

/**
 * Domain repository for OTP code persistence.
 */
public interface IOtpCodeRepository {
    Mono<OtpCode> save(OtpCode otpCode);
}

