package com.service.auth.dao.impl;

import com.service.auth.dao.OtpCodeR2dbcRepository;
import com.service.common.entity.OtpCode;
import com.service.auth.domain.IOtpCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
@RequiredArgsConstructor
public class OtpCodeRepositoryImpl implements IOtpCodeRepository {
    private final OtpCodeR2dbcRepository otpCodeR2dbcRepository;

    @Override
    public Mono<OtpCode> save(OtpCode otpCode) {
        return otpCodeR2dbcRepository.save(otpCode);
    }
}

