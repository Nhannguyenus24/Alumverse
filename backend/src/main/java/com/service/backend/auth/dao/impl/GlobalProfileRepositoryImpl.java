package com.service.backend.auth.dao.impl;

import com.service.backend.auth.dao.GlobalProfileR2dbcRepository;
import com.service.backend.auth.domain.entity.GlobalProfile;
import com.service.backend.auth.domain.repository.IGlobalProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
@RequiredArgsConstructor
public class GlobalProfileRepositoryImpl implements IGlobalProfileRepository {
    private final GlobalProfileR2dbcRepository globalProfileR2dbcRepository;

    @Override
    public Mono<GlobalProfile> save(GlobalProfile profile) {
        return globalProfileR2dbcRepository.save(profile);
    }

    @Override
    public Mono<GlobalProfile> findByUserId(Long userId) {
        return globalProfileR2dbcRepository.findById(userId);
    }
}
