package com.service.backend.shared.service;

import com.service.backend.shared.dto.BatchModerationResponse;
import com.service.backend.shared.enums.ModerationTag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AITagService {

    private final ModerationService moderationService;
    private static final int MAX_CHARS_PER_BATCH = 2000;
    private static final int MAX_ITEMS_PER_BATCH = 15;
    private final Scheduler heavyTaskScheduler;

    @Value("${gemini.tagging.enabled:true}")
    private boolean taggingEnabled;

    public AITagService(ModerationService moderationService,
                        @Qualifier("heavyTaskScheduler") Scheduler heavyTaskScheduler) {
        this.moderationService = moderationService;
        this.heavyTaskScheduler = heavyTaskScheduler;
    }

    /**
     * Tags a list of contents by dynamically batching them with custom available tags.
     */
    public Flux<String> tagContents(List<String> contents, String availableTags) {
        if (contents == null || contents.isEmpty()) {
            return Flux.empty();
        }

        if (!taggingEnabled) {
            return Flux.fromIterable(contents)
                    .map(c -> ModerationTag.NORMAL.name());
        }

        List<String> cleaned = contents.stream()
                .map(c -> c == null ? "" : c.trim())
                .toList();

        List<List<String>> dynamicBatches = new ArrayList<>();
        List<String> currentBatch = new ArrayList<>();
        int currentBatchChars = 0;

        for (String content : cleaned) {
            if (!currentBatch.isEmpty() &&
                    (currentBatchChars + content.length() > MAX_CHARS_PER_BATCH ||
                            currentBatch.size() >= MAX_ITEMS_PER_BATCH)) {

                dynamicBatches.add(new ArrayList<>(currentBatch));
                currentBatch.clear();
                currentBatchChars = 0;
            }

            currentBatch.add(content);
            currentBatchChars += content.length();
        }

        if (!currentBatch.isEmpty()) {
            dynamicBatches.add(currentBatch);
        }

        return Flux.fromIterable(dynamicBatches)
                .flatMapSequential(batch -> processBatch(batch, availableTags), 3)
                .flatMapIterable(BatchModerationResponse::getTags);
    }

    private Mono<BatchModerationResponse> processBatch(List<String> batch, String tags) {
        return Mono.fromCallable(() -> moderationService.analyzeContents(batch, tags))
                .subscribeOn(heavyTaskScheduler)
                .onErrorResume(e -> {
                    log.error("AI Dynamic Batch Tagging failed. Items: {}. Error: {}", batch.size(), e.getMessage());
                    List<String> fallbackTags = batch.stream().map(s -> ModerationTag.NORMAL.name()).collect(Collectors.toList());
                    return Mono.just(new BatchModerationResponse(fallbackTags));
                });
    }
}