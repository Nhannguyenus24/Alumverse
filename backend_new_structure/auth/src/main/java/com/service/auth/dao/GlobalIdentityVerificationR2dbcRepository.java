package com.service.auth.dao;

import com.service.common.entity.GlobalIdentityVerification;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface GlobalIdentityVerificationR2dbcRepository extends R2dbcRepository<GlobalIdentityVerification, Long> {
}
