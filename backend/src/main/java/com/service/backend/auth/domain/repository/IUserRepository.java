package com.service.backend.auth.domain.repository;

import com.service.backend.auth.domain.entity.User;
import reactor.core.publisher.Mono;

public interface IUserRepository {
    Mono<User> save(User user);
    Mono<User> findById(Long id);
    Mono<User> findByEmail(String email);
    Mono<Boolean> existsByEmail(String email);
    Mono<User> updatePassword(Long userId, String newPasswordHash);
    Mono<User> activateUser(Long userId);
    Mono<User> deactivateUser(Long userId);
}
