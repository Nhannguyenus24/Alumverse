package com.service.backend.chat.controller;

import com.service.backend.chat.dto.ConnectionSearchItemResponse;
import com.service.backend.chat.service.ConnectionSearchService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Chat > Connections", description = "API endpoints for searching connections")
@RestController
@RequestMapping("/api/chat/connections")
@Validated
@RequiredArgsConstructor
public class ConnectionSearchController {

    private final ConnectionSearchService connectionSearchService;

    @GetMapping("/search")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ConnectionSearchItemResponse>>>> searchConnections(
            @RequestParam(required = false) String fullName,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "5") @Min(1) int size,
            // Ignored for USER/STAFF (their JWT already carries organizationId). ADMIN has no
            // organization in the JWT ("all orgs"), so this lets an admin explicitly pick which
            // organization's connections to view.
            @RequestParam(required = false) Integer organizationId) {

        return connectionSearchService
                .searchConnections(fullName, page, size, organizationId)
                .map(result -> ResponseEntity.ok(
                        new ApiResponse<>("Connections retrieved successfully", result)));
    }
}
