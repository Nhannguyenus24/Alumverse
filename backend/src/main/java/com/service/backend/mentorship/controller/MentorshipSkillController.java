package com.service.backend.mentorship.controller;

import com.service.backend.mentorship.dto.ExtractSkillsRequest;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.SkillTagsResponse;
import com.service.backend.shared.service.SkillExtractionService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import com.service.backend.shared.service.SkillExtractionFallback;

/**
 * ME-02: extracts skill/expertise tags from a free-text description so mentors
 * and mentees don't have to enter skill blocks by hand. Authenticated by
 * default (see SecurityConfig anyExchange().authenticated()).
 */
@Tag(name = "Mentorship > Skills", description = "AI-assisted skill tag extraction")
@RestController
@RequestMapping("/api/mentorship/skills")
@RequiredArgsConstructor
@Validated
public class MentorshipSkillController {

    private final SkillExtractionService skillExtractionService;

    @PostMapping("/extract")
    public Mono<ResponseEntity<ApiResponse<SkillTagsResponse>>> extractSkills(
            @Valid @RequestBody ExtractSkillsRequest request) {
        return Mono.fromCallable(() -> skillExtractionService.extractTags(request.getText()))
                .subscribeOn(Schedulers.boundedElastic())
                // If the AI returns nothing usable, degrade to the heuristic extractor
                // so delimited input still yields tags even when Gemini is unavailable.
                .map(result -> result != null && result.getTags() != null && !result.getTags().isEmpty()
                        ? result
                        : SkillExtractionFallback.extract(request.getText()))
                .onErrorResume(e -> Mono.just(SkillExtractionFallback.extract(request.getText())))
                .map(result -> ResponseEntity.ok(
                        new ApiResponse<>("Skill tags extracted", result)));
    }
}
