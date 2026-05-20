package com.service.backend.shared.service;

import com.service.backend.shared.dto.BatchModerationResponse;
import com.service.backend.shared.enums.ModerationTag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AITagService {

    private final ModerationService moderationService;
    private static final int MAX_CHARS_PER_BATCH = 2000;
    private static final int MAX_ITEMS_PER_BATCH = 15;
    private final String availableTags;

    public AITagService(ModerationService moderationService) {
        this.moderationService = moderationService;
        this.availableTags = ModerationTag.getAllTagsAsString();
    }

    /**
     * Tags a single piece of content.
     */
    public Mono<String> tagContent(String content) {
        return tagContents(Collections.singletonList(content))
                .next()
                .defaultIfEmpty(ModerationTag.NORMAL.name());
    }

    /**
     * Tags a list of contents by dynamically batching them.
     */
    public Flux<String> tagContents(List<String> contents) {
        if (contents == null || contents.isEmpty()) {
            return Flux.empty();
        }

        List<String> cleaned = contents.stream()
                .map(c -> c == null ? "" : c.trim())
                .collect(Collectors.toList());

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
                .flatMapSequential(this::processBatch, 3) 
                .flatMapIterable(BatchModerationResponse::getTags);
    }

    private Mono<BatchModerationResponse> processBatch(List<String> batch) {
        return Mono.fromCallable(() -> moderationService.analyzeContents(batch, availableTags))
                .subscribeOn(Schedulers.boundedElastic())
                .onErrorResume(e -> {
                    log.error("AI Dynamic Batch Tagging failed. Items: {}. Error: {}", batch.size(), e.getMessage());
                    List<String> fallbackTags = batch.stream().map(s -> ModerationTag.NORMAL.name()).collect(Collectors.toList());
                    return Mono.just(new BatchModerationResponse(fallbackTags));
                });
    }
}
