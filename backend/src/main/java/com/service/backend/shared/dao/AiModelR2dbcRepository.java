package com.service.backend.shared.dao;

import com.service.backend.shared.entity.AiModel;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AiModelR2dbcRepository extends R2dbcRepository<AiModel, Integer> {

    Flux<AiModel> findByProviderIdAndEnabledTrueOrderByPriorityAscIdAsc(Integer providerId);

    Flux<AiModel> findByProviderIdOrderByPriorityAscIdAsc(Integer providerId);

    Mono<Void> deleteByProviderId(Integer providerId);
}
