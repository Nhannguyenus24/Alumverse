package com.service.backend.fundraising.dao;

import com.service.backend.shared.entity.User;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface UserR2dbcRepository extends R2dbcRepository<User, Integer> {
    @Query("SELECT * FROM users WHERE email = :email")
    Mono<User> findByEmail(String email);
}
