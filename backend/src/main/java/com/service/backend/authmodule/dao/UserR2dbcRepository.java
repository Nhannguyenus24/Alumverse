package com.service.backend.authmodule.dao;

import com.service.backend.authmodule.domain.entity.User;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Mono;

public interface UserR2dbcRepository extends R2dbcRepository<User, Long> {
    Mono<Boolean> existByEmail(String email);
    Mono<User> findByEmail(String email);
}
