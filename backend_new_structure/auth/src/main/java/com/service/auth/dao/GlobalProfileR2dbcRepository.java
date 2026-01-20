package com.service.auth.dao;

import com.service.common.entity.GlobalProfile;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface GlobalProfileR2dbcRepository extends R2dbcRepository<GlobalProfile, Long> {
}
