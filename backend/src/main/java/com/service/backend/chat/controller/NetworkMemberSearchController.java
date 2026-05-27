package com.service.backend.chat.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.service.backend.chat.dto.NetworkMemberSearchItemResponse;
import com.service.backend.chat.service.NetworkMemberSearchService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;

import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

/**
 * Network directory search (Kết nối) — members within the authenticated user's organization.
 */
@RestController
@RequestMapping("/api/chat/network")
@Validated
@RequiredArgsConstructor
public class NetworkMemberSearchController {

    private final NetworkMemberSearchService networkMemberSearchService;

    /**
     * Search organization members by profile and academic fields.
     *
     * @param fullName   optional; partial match on global_profiles.full_name
     * @param program    optional; partial match on organization_members.program
     * @param major      optional; partial match on organization_members.major
     * @param startYear  optional; exact match on academic_records.start_year
     */
    @GetMapping("/members")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<NetworkMemberSearchItemResponse>>>> searchMembers(
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String program,
            @RequestParam(required = false) String major,
            @RequestParam(required = false) Integer startYear,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "9") @Min(1) int size) {

        return this.networkMemberSearchService
                .searchMembers(fullName, program, major, startYear, page, size)
                .map(result -> ResponseEntity.ok(
                        new ApiResponse<>("Network members retrieved successfully", result)));
    }
}
