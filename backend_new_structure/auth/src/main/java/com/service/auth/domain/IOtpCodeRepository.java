package com.service.auth.domain;

import com.service.common.entity.OtpCode;
import reactor.core.publisher.Mono;

/**
 * Domain repository for OTP code persistence.
 */
public interface IOtpCodeRepository {
    Mono<OtpCode> save(OtpCode otpCode);
}

