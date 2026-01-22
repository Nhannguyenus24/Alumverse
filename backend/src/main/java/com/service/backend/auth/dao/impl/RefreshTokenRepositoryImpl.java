package com.service.backend.auth.dao.impl;


import com.service.backend.auth.dao.RefreshTokenR2dbcRepository;
import com.service.backend.auth.domain.entity.RefreshToken;
import com.service.backend.auth.domain.repository.IRefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
@RequiredArgsConstructor
public class RefreshTokenRepositoryImpl implements IRefreshTokenRepository {
    private final RefreshTokenR2dbcRepository refreshTokenR2dbcRepository;

    @Override
    public Mono<RefreshToken> save(RefreshToken token) {
        return this.refreshTokenR2dbcRepository.save(token);
    }

}
