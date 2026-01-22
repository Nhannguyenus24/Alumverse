package com.service.backend.auth.domain.repository;

import com.service.backend.auth.domain.entity.GlobalProfile;
import reactor.core.publisher.Mono;

public interface IGlobalProfileRepository {
    Mono<GlobalProfile> save(GlobalProfile profile);
    Mono<GlobalProfile> findByUserId(Long userId);
}
