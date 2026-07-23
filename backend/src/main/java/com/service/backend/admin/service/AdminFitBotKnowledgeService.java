package com.service.backend.admin.service;

import com.service.backend.admin.dto.FitBotKnowledgeRequest;
import com.service.backend.admin.dto.FitBotKnowledgeResponse;
import com.service.backend.fitbot.service.FitBotService;
import com.service.backend.shared.dao.FitBotKnowledgeDocumentRepository;
import com.service.backend.shared.entity.FitBotKnowledgeDocument;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AdminFitBotKnowledgeService {

    private static final Logger log = LoggerFactory.getLogger(AdminFitBotKnowledgeService.class);
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_SYNCED = "SYNCED";
    private static final String STATUS_FAILED = "FAILED";

    private final FitBotKnowledgeDocumentRepository repository;
    private final FitBotService fitBotService;

    public AdminFitBotKnowledgeService(FitBotKnowledgeDocumentRepository repository,
                                       FitBotService fitBotService) {
        this.repository = repository;
        this.fitBotService = fitBotService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void syncPendingOnStartup() {
        syncPending().subscribe(
                count -> log.info("FitBot knowledge startup sync completed: {} document(s)", count),
                e -> log.warn("FitBot knowledge startup sync failed: {}", e.getMessage()));
    }

    public Mono<List<FitBotKnowledgeResponse>> getAll() {
        return repository.findAllByOrderByUpdatedAtDesc()
                .map(this::toResponse)
                .collectList();
    }

    public Mono<FitBotKnowledgeResponse> getById(Long id) {
        return findById(id).map(this::toResponse);
    }

    public Mono<FitBotKnowledgeResponse> create(FitBotKnowledgeRequest request, Long userId) {
        LocalDateTime now = LocalDateTime.now();
        FitBotKnowledgeDocument doc = FitBotKnowledgeDocument.builder()
                .sourceName("fitbot-db-" + UUID.randomUUID())
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .enabled(request.getEnabled() == null || request.getEnabled())
                .syncStatus(STATUS_PENDING)
                .createdAt(now)
                .updatedAt(now)
                .updatedBy(userId)
                .build();
        return repository.save(doc)
                .flatMap(saved -> sync(saved).map(this::toResponse));
    }

    public Mono<FitBotKnowledgeResponse> update(Long id, FitBotKnowledgeRequest request, Long userId) {
        return findById(id)
                .flatMap(doc -> {
                    doc.setTitle(request.getTitle().trim());
                    doc.setContent(request.getContent().trim());
                    doc.setEnabled(request.getEnabled() == null || request.getEnabled());
                    doc.setSyncStatus(STATUS_PENDING);
                    doc.setSyncError(null);
                    doc.setUpdatedAt(LocalDateTime.now());
                    doc.setUpdatedBy(userId);
                    return repository.save(doc);
                })
                .flatMap(saved -> sync(saved).map(this::toResponse));
    }

    public Mono<Void> delete(Long id) {
        return findById(id)
                .flatMap(doc -> fitBotService.deleteSource(doc.getSourceName())
                        .then(repository.delete(doc)));
    }

    public Mono<FitBotKnowledgeResponse> syncOne(Long id) {
        return findById(id)
                .flatMap(doc -> sync(doc).map(this::toResponse));
    }

    public Mono<Integer> syncAll() {
        return repository.findAllByOrderByUpdatedAtDesc()
                .concatMap(this::sync)
                .count()
                .map(Long::intValue);
    }

    private Mono<Integer> syncPending() {
        return repository.findBySyncStatusNotOrderByUpdatedAtAsc(STATUS_SYNCED)
                .concatMap(this::sync)
                .count()
                .map(Long::intValue);
    }

    private Mono<FitBotKnowledgeDocument> sync(FitBotKnowledgeDocument doc) {
        Mono<Void> operation = fitBotService.deleteSource(doc.getSourceName())
                .then(Boolean.TRUE.equals(doc.getEnabled())
                        ? fitBotService.addDocument(doc.getSourceName(), doc.getContent())
                        : Mono.empty());

        return operation
                .then(Mono.defer(() -> {
                    doc.setSyncStatus(STATUS_SYNCED);
                    doc.setSyncError(null);
                    doc.setLastSyncedAt(LocalDateTime.now());
                    doc.setUpdatedAt(LocalDateTime.now());
                    return repository.save(doc);
                }))
                .onErrorResume(e -> {
                    doc.setSyncStatus(STATUS_FAILED);
                    doc.setSyncError(shortError(e));
                    doc.setUpdatedAt(LocalDateTime.now());
                    return repository.save(doc);
                });
    }

    private Mono<FitBotKnowledgeDocument> findById(Long id) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND,
                        "Không tìm thấy FitBot knowledge document")));
    }

    private String shortError(Throwable e) {
        String msg = rootMessage(e);
        return StringUtils.hasText(msg) && msg.length() > 500 ? msg.substring(0, 500) + "…" : msg;
    }

    private String rootMessage(Throwable e) {
        Throwable cur = e;
        while (cur.getCause() != null && cur.getCause() != cur) {
            cur = cur.getCause();
        }
        return cur.getMessage() != null ? cur.getMessage() : cur.getClass().getSimpleName();
    }

    private FitBotKnowledgeResponse toResponse(FitBotKnowledgeDocument doc) {
        return FitBotKnowledgeResponse.builder()
                .id(doc.getId())
                .sourceName(doc.getSourceName())
                .title(doc.getTitle())
                .content(doc.getContent())
                .enabled(doc.getEnabled())
                .syncStatus(doc.getSyncStatus())
                .syncError(doc.getSyncError())
                .lastSyncedAt(doc.getLastSyncedAt())
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }
}
