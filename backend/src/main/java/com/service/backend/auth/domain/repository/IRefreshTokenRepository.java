package com.service.backend.auth.domain.repository;

import com.service.backend.auth.domain.entity.RefreshToken;
import reactor.core.publisher.Mono;

public interface IRefreshTokenRepository {
    Mono<RefreshToken> save(RefreshToken token);
}
