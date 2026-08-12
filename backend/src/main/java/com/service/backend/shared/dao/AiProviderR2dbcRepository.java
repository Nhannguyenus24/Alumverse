package com.service.backend.shared.dao;

import com.service.backend.shared.entity.AiProvider;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Repository
public interface AiProviderR2dbcRepository extends R2dbcRepository<AiProvider, Integer> {

    Flux<AiProvider> findByEnabledTrueOrderByPriorityAscIdAsc();

    Flux<AiProvider> findAllByOrderByPriorityAscIdAsc();

    /** Provider đang bật, chưa bị đánh dấu hết quota — dùng để build chain. */
    Flux<AiProvider> findByEnabledTrueAndQuotaExhaustedAtIsNullOrderByPriorityAscIdAsc();

    /** Provider đang bật nhưng đang cooldown — job health-check định kỳ dò lại. */
    Flux<AiProvider> findByEnabledTrueAndQuotaExhaustedAtIsNotNull();

    @Modifying
    @Query("UPDATE ai_providers SET quota_exhausted_at = :at WHERE id = :id AND quota_exhausted_at IS NULL")
    Mono<Integer> markQuotaExhausted(Integer id, LocalDateTime at);

    @Modifying
    @Query("UPDATE ai_providers SET quota_exhausted_at = NULL WHERE id = :id")
    Mono<Integer> clearQuotaExhausted(Integer id);
}
