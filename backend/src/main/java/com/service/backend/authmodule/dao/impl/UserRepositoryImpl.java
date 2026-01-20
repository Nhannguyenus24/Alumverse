package com.service.backend.authmodule.dao.impl;

import com.service.backend.authmodule.dao.UserR2dbcRepository;
import com.service.backend.authmodule.domain.entity.User;
import com.service.backend.authmodule.domain.repository.IUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
@RequiredArgsConstructor
public class UserRepositoryImpl implements IUserRepository {
    private final UserR2dbcRepository userR2dbcRepository;

    @Override
    public Mono<User> save(User user) {
        return userR2dbcRepository.save(user);
    }

    @Override
    public Mono<User> findById(Long id) {
        return userR2dbcRepository.findById(id);
    }

    @Override
    public Mono<User> findByEmail(String email) {
        return userR2dbcRepository.findByEmail(email);
    }

    @Override
    public Mono<Boolean> existsByEmail(String email) {
        return userR2dbcRepository.existByEmail(email);
    }

    @Override
    public Mono<User> updatePassword(Long userId, String newPasswordHash) {
        return userR2dbcRepository.findById(userId)
                .flatMap(user -> {
                    user.setPasswordHash(newPasswordHash);
                    return userR2dbcRepository.save(user);
                });
    }

    @Override
    public Mono<User> activateUser(Long userId) {
        return userR2dbcRepository.findById(userId)
                .flatMap(user -> {
                    user.setIsActive(true);
                    return userR2dbcRepository.save(user);
                });
    }

    @Override
    public Mono<User> deactivateUser(Long userId) {
        return userR2dbcRepository.findById(userId)
                .flatMap(user -> {
                    user.setIsActive(false);
                    return userR2dbcRepository.save(user);
                });
    }
}
