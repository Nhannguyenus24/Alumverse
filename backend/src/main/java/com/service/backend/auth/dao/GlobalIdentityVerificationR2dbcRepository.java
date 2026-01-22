package com.service.backend.auth.dao;

import com.service.backend.auth.domain.entity.GlobalIdentityVerification;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface GlobalIdentityVerificationR2dbcRepository extends R2dbcRepository<GlobalIdentityVerification, Long> {
}
