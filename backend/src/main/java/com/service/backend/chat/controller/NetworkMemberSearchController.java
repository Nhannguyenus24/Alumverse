package com.service.backend.chat.controller;

import java.util.List;

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
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Network directory search (Kết nối) — members across all organizations, optionally
 * narrowed to a chosen set of organizations.
 */
@Tag(name = "Chat > Network Search", description = "API endpoints for searching members within the network")
@RestController
@RequestMapping("/api/chat/network")
@Validated
@RequiredArgsConstructor
public class NetworkMemberSearchController {

    private final NetworkMemberSearchService networkMemberSearchService;

    /**
     * Search organization members by profile and academic fields.
     *
     * @param fullName        optional; partial match on global_profiles.full_name
     * @param program         optional; partial match on organization_members.program
     * @param major           optional; partial match on organization_members.major
     * @param organizationIds optional; restrict to these organizations. When omitted,
     *                        the directory spans every organization (all slugs).
     */
    @GetMapping("/members")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<NetworkMemberSearchItemResponse>>>> searchMembers(
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String program,
            @RequestParam(required = false) String major,
            @RequestParam(required = false) List<Integer> organizationIds,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "9") @Min(1) int size) {

        return this.networkMemberSearchService
                .searchMembers(organizationIds, fullName, program, major, page, size)
                .map(result -> ResponseEntity.ok(
                        new ApiResponse<>("Network members retrieved successfully", result)));
    }
}
