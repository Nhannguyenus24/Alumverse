package com.service.backend.authmodule.dao;

import com.service.backend.authmodule.domain.entity.OtpCode;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Mono;

public interface OtpCodeR2dbcRepository extends R2dbcRepository<OtpCode, Long> {

}

