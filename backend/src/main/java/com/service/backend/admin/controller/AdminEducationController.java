package com.service.backend.admin.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.service.backend.admin.dto.EducationChangeRequestAdminDTO;
import com.service.backend.admin.dto.ReviewEducationChangeRequestDTO;
import com.service.backend.admin.service.AdminEducationService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.SecurityUtils;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;
import org.springframework.security.access.prepost.PreAuthorize;

@Tag(name = "Admin > Education Requests", description = "API for admin to review education change requests")
@RestController
@RequestMapping("/api/admin/education-requests")
@Validated
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminEducationController {

    private final AdminEducationService adminEducationService;

    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<EducationChangeRequestAdminDTO>>>> getRequests(
            @RequestParam Integer organizationId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminEducationService.getRequests(resolvedOrgId, status, page, size))
                .map(data -> ResponseEntity.ok(new ApiResponse<>("Education requests fetched successfully", data)));
    }

    @PutMapping("/{requestId}")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> reviewRequest(
            @PathVariable Integer requestId,
            @Valid @RequestBody ReviewEducationChangeRequestDTO dto) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(adminId -> adminEducationService.reviewRequest(requestId, dto, adminId.intValue()))
                .map(result -> ResponseEntity.ok(new ApiResponse<>("Yêu cầu đã được xử lý.", result)));
    }
}
