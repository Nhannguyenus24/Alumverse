package com.service.auth.dao.impl;


import com.service.auth.dao.RefreshTokenR2dbcRepository;
import com.service.auth.domain.IRefreshTokenRepository;
import com.service.common.entity.RefreshToken;
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
