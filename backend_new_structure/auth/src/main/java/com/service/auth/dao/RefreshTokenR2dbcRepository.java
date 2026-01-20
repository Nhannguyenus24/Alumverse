package com.service.auth.dao;

import com.service.common.entity.RefreshToken;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface RefreshTokenR2dbcRepository extends R2dbcRepository<RefreshToken, Long> {
}
