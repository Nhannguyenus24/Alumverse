package com.service.auth.domain;

import com.service.common.entity.RefreshToken;
import reactor.core.publisher.Mono;

public interface IRefreshTokenRepository {
    Mono<RefreshToken> save(RefreshToken token);
}
