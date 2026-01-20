package com.service.backend.authmodule.dao;

import com.service.backend.authmodule.domain.entity.GlobalIdentityVerification;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface GlobalIdentityVerificationR2dbcRepository extends R2dbcRepository<GlobalIdentityVerification, Long> {
}
