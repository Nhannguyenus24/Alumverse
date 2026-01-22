package com.service.backend.auth.dao;

import com.service.backend.auth.domain.entity.RefreshToken;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface RefreshTokenR2dbcRepository extends R2dbcRepository<RefreshToken, Long> {
}
