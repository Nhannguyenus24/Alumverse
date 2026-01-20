package com.service.auth.dao.impl;

import com.service.auth.dao.GlobalProfileR2dbcRepository;
import com.service.common.entity.GlobalProfile;
import com.service.auth.domain.IGlobalProfileRepository;
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
