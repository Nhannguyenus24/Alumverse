package com.service.backend.mentorship.controller;

import com.service.backend.mentorship.dto.MentorshipHubStatsResponse;
import com.service.backend.mentorship.service.MentorshipHubService;
import com.service.backend.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@Tag(name = "Mentorship > Hub", description = "API endpoints for mentorship hub display")
@RestController
@RequestMapping("/api/mentorship/hub")
@RequiredArgsConstructor
@Validated
public class MentorshipHubController {

    private final MentorshipHubService hubService;

    @GetMapping("/stats")
    public Mono<ResponseEntity<ApiResponse<MentorshipHubStatsResponse>>> getHubStats(
            @RequestParam(defaultValue = "5") @Min(1) int limit) {
        return hubService.getHubStats(limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Hub stats retrieved successfully", response)));
    }
}
