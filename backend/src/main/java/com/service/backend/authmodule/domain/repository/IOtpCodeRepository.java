package com.service.backend.authmodule.domain.repository;

import com.service.backend.authmodule.domain.entity.OtpCode;
import reactor.core.publisher.Mono;

/**
 * Domain repository for OTP code persistence.
 */
public interface IOtpCodeRepository {
    Mono<OtpCode> save(OtpCode otpCode);
}

