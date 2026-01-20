package com.service.backend.authmodule.dao;

import com.service.backend.authmodule.domain.entity.GlobalProfile;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface GlobalProfileR2dbcRepository extends R2dbcRepository<GlobalProfile, Long> {
}
