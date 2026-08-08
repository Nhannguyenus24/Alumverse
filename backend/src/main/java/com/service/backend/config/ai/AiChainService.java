package com.service.backend.config.ai;

import com.service.backend.config.ai.FailoverChatModel.Delegate;
import com.service.backend.shared.dao.AiModelR2dbcRepository;
import com.service.backend.shared.dao.AiProviderR2dbcRepository;
import com.service.backend.shared.entity.AiProvider;
import com.service.backend.shared.utils.AiSecretCipher;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AiChainService {

    private static final Logger log = LoggerFactory.getLogger(AiChainService.class);

    private final AiProviderR2dbcRepository providerRepo;
    private final AiModelR2dbcRepository modelRepo;
    private final AiModelFactory factory;
    private final AiSecretCipher cipher;
    private final DynamicChatModel dynamicChatModel;

    @Value("${gemini.model.temperature:0.0}")
    private double defaultTemperature;

    public AiChainService(AiProviderR2dbcRepository providerRepo,
                          AiModelR2dbcRepository modelRepo,
                          AiModelFactory factory,
                          AiSecretCipher cipher,
                          DynamicChatModel dynamicChatModel) {
        this.providerRepo = providerRepo;
        this.modelRepo = modelRepo;
        this.factory = factory;
        this.cipher = cipher;
        this.dynamicChatModel = dynamicChatModel;
    }

    /** Nạp chuỗi lần đầu khi app sẵn sàng (DB đã kết nối). */
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        reload().subscribe(
                n -> log.info("AI chain initialized with {} link(s).", n),
                e -> log.error("AI chain initial load failed.", e));
    }

    public Mono<Integer> reload() {
        return buildChainFromDb()
                .map(chain -> {
                    if (!chain.isEmpty()) {
                        dynamicChatModel.reload(new FailoverChatModel(chain, this::onQuotaExhausted));
                        log.info("AI chain reloaded from DB: {} link(s).", chain.size());
                        return chain.size();
                    }
                    List<ChatLanguageModel> fromProps = factory.buildChain();
                    if (!fromProps.isEmpty()) {
                        List<Delegate> delegates = fromProps.stream()
                                .map(model -> new Delegate(null, model))
                                .toList();
                        dynamicChatModel.reload(new FailoverChatModel(delegates, this::onQuotaExhausted));
                        log.info("AI chain reloaded from application.properties: {} link(s).", fromProps.size());
                        return fromProps.size();
                    }
                    dynamicChatModel.reload(null);
                    log.warn("AI chain empty — AI services will use local fallbacks.");
                    return 0;
                })
                .onErrorResume(e -> {
                    log.error("Failed to reload AI chain from DB, keeping previous chain.", e);
                    return Mono.just(dynamicChatModel.isAvailable() ? 1 : 0);
                });
    }

    /** Callback của FailoverChatModel khi 1 provider trong chain vừa dính lỗi quota/rate-limit. */
    private void onQuotaExhausted(Integer providerId) {
        providerRepo.markQuotaExhausted(providerId, LocalDateTime.now())
                .filter(updated -> updated > 0)
                .doOnNext(updated -> log.warn("AI provider #{} marked quota-exhausted — cooling down until health-check.", providerId))
                .subscribe(updated -> { }, e -> log.warn("Failed to mark provider #{} quota-exhausted", providerId, e));
    }

    private Mono<List<Delegate>> buildChainFromDb() {
        return providerRepo.findByEnabledTrueAndQuotaExhaustedAtIsNullOrderByPriorityAscIdAsc()
                .concatMap(this::modelsForProvider)
                .collectList();
    }

    private reactor.core.publisher.Flux<Delegate> modelsForProvider(AiProvider provider) {
        if (provider.getApiKeyEnc() == null || provider.getApiKeyEnc().isBlank()) {
            log.warn("AI provider '{}' has no API key — skipped.", provider.getName());
            return reactor.core.publisher.Flux.empty();
        }
        final String apiKey;
        try {
            apiKey = cipher.decrypt(provider.getApiKeyEnc());
        } catch (RuntimeException e) {
            log.warn("AI provider '{}' key decrypt failed — skipped.", provider.getName());
            return reactor.core.publisher.Flux.empty();
        }
        return modelRepo.findByProviderIdAndEnabledTrueOrderByPriorityAscIdAsc(provider.getId())
                .mapNotNull(m -> {
                    try {
                        ChatLanguageModel model = factory.buildModel(
                                provider.getProviderType(), provider.getBaseUrl(),
                                apiKey, m.getModelName(), defaultTemperature);
                        log.info("AI chain link: provider '{}' model '{}'.", provider.getName(), m.getModelName());
                        return new Delegate(provider.getId(), model);
                    } catch (RuntimeException e) {
                        log.warn("AI chain: skip provider '{}' model '{}' — {}",
                                provider.getName(), m.getModelName(), e.getMessage());
                        return null;
                    }
                });
    }
}
