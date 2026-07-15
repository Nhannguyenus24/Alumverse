package com.service.backend.shared.dao;

import com.service.backend.shared.entity.AiProvider;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface AiProviderR2dbcRepository extends R2dbcRepository<AiProvider, Integer> {

    Flux<AiProvider> findByEnabledTrueOrderByPriorityAscIdAsc();

    Flux<AiProvider> findAllByOrderByPriorityAscIdAsc();
}
