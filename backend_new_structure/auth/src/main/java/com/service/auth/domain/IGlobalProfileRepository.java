package com.service.auth.domain;

import com.service.common.entity.GlobalProfile;
import reactor.core.publisher.Mono;

public interface IGlobalProfileRepository {
    Mono<GlobalProfile> save(GlobalProfile profile);
    Mono<GlobalProfile> findByUserId(Long userId);
}