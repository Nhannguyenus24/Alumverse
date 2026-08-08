package com.service.backend.shared.cronjob;

import com.service.backend.config.ai.AiChainService;
import com.service.backend.config.ai.AiModelFactory;
import com.service.backend.shared.dao.AiModelR2dbcRepository;
import com.service.backend.shared.dao.AiProviderR2dbcRepository;
import com.service.backend.shared.entity.AiProvider;
import com.service.backend.shared.utils.AiSecretCipher;
import dev.langchain4j.model.chat.ChatLanguageModel;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.concurrent.TimeUnit;
import io.micrometer.core.instrument.MeterRegistry;

/**
 * Dò lại các AI provider đang bị đánh dấu hết quota (ai_providers.quota_exhausted_at).
 * Test 1 model đại diện (priority thấp nhất) — quota chặn ở tầng key nên không cần test
 * hết mọi model. Trả lời được thì gỡ cờ và nạp lại chuỗi để provider trở lại đúng vị trí
 * priority của nó ngay từ request kế tiếp.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ai.provider.healthcheck.enabled", havingValue = "true", matchIfMissing = true)
public class AiProviderHealthCheckTask {

    private static final Logger log = LoggerFactory.getLogger(AiProviderHealthCheckTask.class);

    private final AiProviderR2dbcRepository providerRepo;
    private final AiModelR2dbcRepository modelRepo;
    private final AiModelFactory factory;
    private final AiSecretCipher cipher;
    private final AiChainService chainService;
    private final MeterRegistry meterRegistry;

    @Scheduled(cron = "${ai.provider.healthcheck.cron:0 0 */8 * * *}")
    public void checkExhaustedProviders() {
        long startTime = System.currentTimeMillis();
        log.info("START: AiProviderHealthCheckTask checking exhausted providers");

        providerRepo.findByEnabledTrueAndQuotaExhaustedAtIsNotNull()
                .flatMap(this::checkAndMaybeRecover, 4)
                .count()
                .flatMap(recovered -> recovered > 0 ? chainService.reload().thenReturn(recovered) : Mono.just(recovered))
                .doOnSuccess(recovered -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "AiProviderHealthCheck", "status", "success")
                            .record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.info("END (SUCCESS): AiProviderHealthCheckTask finished. Recovered {} provider(s). Duration: {} ms",
                            recovered, endTime - startTime);
                })
                .onErrorResume(e -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "AiProviderHealthCheck", "status", "error")
                            .record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.error("END (ERROR): AiProviderHealthCheckTask failed. Duration: {} ms", endTime - startTime, e);
                    return Mono.empty();
                })
                .subscribe();
    }

    /** true nếu provider vừa được xác nhận khỏe và gỡ cờ quota-exhausted. */
    private Mono<Boolean> checkAndMaybeRecover(AiProvider provider) {
        return modelRepo.findByProviderIdAndEnabledTrueOrderByPriorityAscIdAsc(provider.getId())
                .next()
                .flatMap(model -> pingModel(provider, model.getModelName()))
                .flatMap(healthy -> {
                    if (!healthy) {
                        return Mono.just(false);
                    }
                    return providerRepo.clearQuotaExhausted(provider.getId())
                            .doOnNext(updated -> log.info("AI provider '{}' recovered — quota available again.", provider.getName()))
                            .thenReturn(true);
                })
                .defaultIfEmpty(false)
                .onErrorResume(e -> {
                    log.warn("AI provider '{}' still unhealthy — {}", provider.getName(), e.getMessage());
                    return Mono.just(false);
                });
    }

    private Mono<Boolean> pingModel(AiProvider provider, String modelName) {
        return Mono.fromCallable(() -> {
                    String apiKey = cipher.decrypt(provider.getApiKeyEnc());
                    ChatLanguageModel model = factory.buildModel(
                            provider.getProviderType(), provider.getBaseUrl(), apiKey, modelName, 0.0);
                    model.generate("Reply with the single word: OK");
                    return true;
                })
                .subscribeOn(Schedulers.boundedElastic());
    }
}
