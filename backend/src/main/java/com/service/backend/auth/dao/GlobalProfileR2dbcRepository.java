package com.service.backend.auth.dao;

import com.service.backend.auth.domain.entity.GlobalProfile;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface GlobalProfileR2dbcRepository extends R2dbcRepository<GlobalProfile, Long> {
}
