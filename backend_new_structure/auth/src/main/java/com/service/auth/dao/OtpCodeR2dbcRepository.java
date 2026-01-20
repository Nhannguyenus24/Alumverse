package com.service.auth.dao;

import com.service.common.entity.OtpCode;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Mono;

public interface OtpCodeR2dbcRepository extends R2dbcRepository<OtpCode, Long> {

}

