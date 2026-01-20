package com.service.auth.dao;

import com.service.common.entity.User;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Mono;

public interface UserR2dbcRepository extends R2dbcRepository<User, Long> {
    Mono<Boolean> existsByEmail(String email);
    Mono<User> findByEmail(String email);
}
