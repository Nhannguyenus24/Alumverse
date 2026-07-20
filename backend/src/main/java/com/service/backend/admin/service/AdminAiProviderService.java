package com.service.backend.admin.service;

import com.service.backend.admin.dto.AiModelDto;
import com.service.backend.admin.dto.AiProviderRequest;
import com.service.backend.admin.dto.AiProviderResponse;
import com.service.backend.config.ai.AiChainService;
import com.service.backend.config.ai.AiModelFactory;
import com.service.backend.shared.dao.AiModelR2dbcRepository;
import com.service.backend.shared.dao.AiProviderR2dbcRepository;
import com.service.backend.shared.entity.AiModel;
import com.service.backend.shared.entity.AiProvider;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.AiSecretCipher;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * CRUD AI provider + model cho admin. Mã hóa API key trước khi lưu, che key khi
 * trả ra UI, và nạp lại chuỗi model ({@link AiChainService#reload()}) sau mỗi
 * thay đổi để có hiệu lực ngay không cần restart.
 */
@Service
public class AdminAiProviderService {

    private static final Logger log = LoggerFactory.getLogger(AdminAiProviderService.class);

    private final AiProviderR2dbcRepository providerRepo;
    private final AiModelR2dbcRepository modelRepo;
    private final AiSecretCipher cipher;
    private final AiChainService chainService;
    private final AiModelFactory factory;

    public AdminAiProviderService(AiProviderR2dbcRepository providerRepo,
                                  AiModelR2dbcRepository modelRepo,
                                  AiSecretCipher cipher,
                                  AiChainService chainService,
                                  AiModelFactory factory) {
        this.providerRepo = providerRepo;
        this.modelRepo = modelRepo;
        this.cipher = cipher;
        this.chainService = chainService;
        this.factory = factory;
    }

    public Mono<List<AiProviderResponse>> getAll() {
        return providerRepo.findAllByOrderByPriorityAscIdAsc()
                .collectList()
                .flatMap(providers -> {
                    if (providers.isEmpty()) return Mono.just(List.of());
                    List<Integer> providerIds = providers.stream().map(AiProvider::getId).toList();
                    // One query for all models instead of one per provider, then group in memory.
                    return modelRepo.findByProviderIdInOrderByPriorityAscIdAsc(providerIds)
                            .collectMultimap(AiModel::getProviderId)
                            .map(modelsByProvider -> providers.stream()
                                    .map(p -> buildResponse(p, modelsByProvider.getOrDefault(p.getId(), List.of())))
                                    .collect(Collectors.toList()));
                });
    }

    public Mono<AiProviderResponse> getById(Integer id) {
        return providerRepo.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "AI provider not found")))
                .flatMap(this::toResponse);
    }

    public Mono<AiProviderResponse> create(AiProviderRequest req) {
        AiProvider provider = AiProvider.builder()
                .name(req.getName())
                .providerType(normalizeType(req.getProviderType()))
                .baseUrl(req.getBaseUrl())
                .apiKeyEnc(cipher.encrypt(req.getApiKey()))
                .enabled(req.getEnabled() == null || req.getEnabled())
                .priority(req.getPriority() == null ? 0 : req.getPriority())
                .build();
        return providerRepo.save(provider)
                .flatMap(saved -> saveModels(saved.getId(), req).thenReturn(saved))
                .flatMap(this::toResponse)
                .flatMap(this::reloadThen);
    }

    public Mono<AiProviderResponse> update(Integer id, AiProviderRequest req) {
        return providerRepo.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "AI provider not found")))
                .flatMap(existing -> {
                    existing.setName(req.getName());
                    existing.setProviderType(normalizeType(req.getProviderType()));
                    existing.setBaseUrl(req.getBaseUrl());
                    existing.setEnabled(req.getEnabled() == null || req.getEnabled());
                    existing.setPriority(req.getPriority() == null ? 0 : req.getPriority());
                    // Key để trống = giữ key cũ; có nhập = ghi đè (mã hóa).
                    if (req.getApiKey() != null && !req.getApiKey().isBlank()) {
                        existing.setApiKeyEnc(cipher.encrypt(req.getApiKey()));
                    }
                    return providerRepo.save(existing);
                })
                .flatMap(saved -> modelRepo.deleteByProviderId(saved.getId())
                        .then(saveModels(saved.getId(), req))
                        .thenReturn(saved))
                .flatMap(this::toResponse)
                .flatMap(this::reloadThen);
    }

    public Mono<Void> delete(Integer id) {
        return providerRepo.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "AI provider not found")))
                .flatMap(p -> providerRepo.deleteById(id)) // model xóa theo ON DELETE CASCADE
                .then(chainService.reload())
                .then();
    }

    /** Gọi thử 1 model của provider để kiểm tra key/endpoint còn sống. */
    public Mono<String> test(Integer providerId, String modelName) {
        return providerRepo.findById(providerId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "AI provider not found")))
                .flatMap(p -> Mono.fromCallable(() -> {
                    String apiKey = cipher.decrypt(p.getApiKeyEnc());
                    ChatLanguageModel model = factory.buildModel(
                            p.getProviderType(), p.getBaseUrl(), apiKey, modelName, 0.0);
                    return model.generate("Reply with the single word: OK");
                }).subscribeOn(Schedulers.boundedElastic()))
                // Lỗi từ nhà cung cấp (429 hết quota, 404 model gỡ, 401 key sai...) không phải
                // lỗi server của ta — trả 400 kèm message gốc để admin đọc được, thay vì 500.
                .onErrorMap(e -> !(e instanceof ApplicationException),
                        e -> new ApplicationException(ErrorCode.BAD_REQUEST, providerError(e)));
    }

    /** Rút gọn message lỗi provider cho dễ đọc trên UI. */
    private String providerError(Throwable e) {
        String msg = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
        if (msg.contains("429") || msg.toLowerCase().contains("rate-limit") || msg.toLowerCase().contains("quota")) {
            return "Model đang bị rate-limit hoặc hết quota, thử lại sau hoặc dùng model khác.";
        }
        if (msg.contains("\"code\":404") || msg.contains("unavailable")) {
            return "Model không tồn tại / không còn free trên provider này. Kiểm tra lại tên model.";
        }
        if (msg.contains("401") || msg.toLowerCase().contains("unauthorized") || msg.toLowerCase().contains("api key")) {
            return "API key không hợp lệ.";
        }
        return msg.length() > 300 ? msg.substring(0, 300) + "…" : msg;
    }

    private Mono<Void> saveModels(Integer providerId, AiProviderRequest req) {
        if (req.getModels() == null || req.getModels().isEmpty()) {
            return Mono.empty();
        }
        List<AiModel> models = req.getModels().stream()
                .filter(m -> m.getModelName() != null && !m.getModelName().isBlank())
                .map(m -> AiModel.builder()
                        .providerId(providerId)
                        .modelName(m.getModelName().trim())
                        .priority(m.getPriority() == null ? 0 : m.getPriority())
                        .enabled(m.getEnabled() == null || m.getEnabled())
                        .build())
                .collect(Collectors.toList());
        return modelRepo.saveAll(models).then();
    }

    /** Nạp lại chuỗi rồi trả về response — dùng sau create/update. */
    private Mono<AiProviderResponse> reloadThen(AiProviderResponse resp) {
        return chainService.reload().thenReturn(resp);
    }

    private Mono<AiProviderResponse> toResponse(AiProvider p) {
        return modelRepo.findByProviderIdOrderByPriorityAscIdAsc(p.getId())
                .collectList()
                .map(models -> buildResponse(p, models));
    }

    /** Build the provider response from already-loaded models (no DB access). */
    private AiProviderResponse buildResponse(AiProvider p, Collection<AiModel> models) {
        List<AiModelDto> modelDtos = models.stream()
                .map(m -> AiModelDto.builder()
                        .id(m.getId())
                        .modelName(m.getModelName())
                        .priority(m.getPriority())
                        .enabled(m.getEnabled())
                        .build())
                .collect(Collectors.toList());
        boolean hasKey = p.getApiKeyEnc() != null && !p.getApiKeyEnc().isBlank();
        String masked = "";
        if (hasKey) {
            try {
                masked = cipher.mask(cipher.decrypt(p.getApiKeyEnc()));
            } catch (RuntimeException e) {
                masked = "••••";
                log.warn("Cannot decrypt key for provider '{}' to mask.", p.getName());
            }
        }
        return AiProviderResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .providerType(p.getProviderType())
                .baseUrl(p.getBaseUrl())
                .apiKeyMasked(masked)
                .hasApiKey(hasKey)
                .enabled(p.getEnabled())
                .priority(p.getPriority())
                .models(modelDtos)
                .build();
    }

    private String normalizeType(String type) {
        if (type == null || type.isBlank()) {
            return "openai_compatible";
        }
        String t = type.trim().toLowerCase();
        return t.equals("gemini") ? "gemini" : "openai_compatible";
    }
}
