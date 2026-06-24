package com.service.backend.admin.controller;

import com.service.backend.admin.dto.AdminMentorProfileDTO;
import com.service.backend.admin.dto.AdminMentorshipSessionDTO;
import com.service.backend.admin.dto.MentorApplicationReviewRequest;
import com.service.backend.admin.dto.MentorshipStatisticsDTO;
import com.service.backend.admin.service.AdminMentorshipService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.service.backend.shared.utils.SecurityUtils;
import reactor.core.publisher.Mono;

@Tag(name = "Admin > Mentorship", description = "API endpoints for managing mentorship programs by administrators")
@RestController
@RequestMapping("/api/admin/mentorship")
@Validated
public class AdminMentorshipController {

    private final AdminMentorshipService adminMentorshipService;

    public AdminMentorshipController(AdminMentorshipService adminMentorshipService) {
        this.adminMentorshipService = adminMentorshipService;
    }

    @Operation(summary = "List all mentorship sessions, optionally filtered by organization")
    @GetMapping("/sessions")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AdminMentorshipSessionDTO>>>> getAllSessions(
            @RequestParam(required = false) Integer organizationId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminMentorshipService.getAllSessions(resolvedOrgId, page, size))
                .switchIfEmpty(adminMentorshipService.getAllSessions(null, page, size))
                .map(p -> ResponseEntity.ok(new ApiResponse<>("Retrieved all mentorship sessions", p)));
    }

    @Operation(summary = "Filter sessions by status, optionally filtered by organization")
    @GetMapping("/sessions/by-status")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AdminMentorshipSessionDTO>>>> getSessionsByStatus(
            @Parameter(example = "Pending")
            @RequestParam @NotBlank(message = "Status is required") String status,
            @RequestParam(required = false) Integer organizationId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminMentorshipService.getSessionsByStatus(resolvedOrgId, status, page, size))
                .switchIfEmpty(adminMentorshipService.getSessionsByStatus(null, status, page, size))
                .map(p -> ResponseEntity.ok(new ApiResponse<>("Retrieved sessions by status", p)));
    }

    @Operation(summary = "Get a session by ID")
    @GetMapping("/sessions/{sessionId}")
    public Mono<ResponseEntity<ApiResponse<AdminMentorshipSessionDTO>>> getSessionById(
            @PathVariable @Min(value = 1, message = "Session ID must be greater than 0") Integer sessionId) {
        return adminMentorshipService.getSessionById(sessionId)
                .map(s -> ResponseEntity.ok(new ApiResponse<>("Retrieved session", s)));
    }

    @Operation(summary = "Force-update a session status (admin override)")
    @PutMapping("/sessions/{sessionId}/status")
    public Mono<ResponseEntity<ApiResponse<AdminMentorshipSessionDTO>>> updateSessionStatus(
            @PathVariable @Min(value = 1, message = "Session ID must be greater than 0") Integer sessionId,
            @Parameter(example = "Cancelled")
            @RequestParam @NotBlank(message = "Status is required") String status) {
        return adminMentorshipService.updateSessionStatus(sessionId, status)
                .map(s -> ResponseEntity.ok(new ApiResponse<>("Session status updated", s)));
    }

    @Operation(summary = "Delete a session (admin override)")
    @DeleteMapping("/sessions/{sessionId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteSession(
            @PathVariable @Min(value = 1, message = "Session ID must be greater than 0") Integer sessionId) {
        return adminMentorshipService.deleteSession(sessionId)
                .thenReturn(ResponseEntity.ok(new ApiResponse<Void>("Session deleted successfully", null)));
    }

    @Operation(summary = "List all mentor profiles, optionally filtered by organization")
    @GetMapping("/mentors")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AdminMentorProfileDTO>>>> getAllMentorProfiles(
            @RequestParam(required = false) Integer organizationId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminMentorshipService.getAllMentorProfiles(resolvedOrgId, page, size))
                .switchIfEmpty(adminMentorshipService.getAllMentorProfiles(null, page, size))
                .map(p -> ResponseEntity.ok(new ApiResponse<>("Retrieved all mentor profiles", p)));
    }

    @Operation(summary = "Filter mentor profiles by status, optionally filtered by organization")
    @GetMapping("/mentors/by-status")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AdminMentorProfileDTO>>>> getMentorProfilesByStatus(
            @Parameter(example = "PENDING")
            @RequestParam String status,
            @RequestParam(required = false) Integer organizationId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminMentorshipService.getMentorProfilesByStatus(resolvedOrgId, status, page, size))
                .switchIfEmpty(adminMentorshipService.getMentorProfilesByStatus(null, status, page, size))
                .map(p -> ResponseEntity.ok(new ApiResponse<>("Retrieved mentor profiles by status", p)));
    }

    @Operation(summary = "Approve a mentor profile")
    @PostMapping("/mentors/{memberId}/approve")
    public Mono<ResponseEntity<ApiResponse<AdminMentorProfileDTO>>> approveMentor(
            @PathVariable @Min(value = 1, message = "Member ID must be greater than 0") Integer memberId) {
        return adminMentorshipService.approveMentor(memberId)
                .map(p -> ResponseEntity.ok(new ApiResponse<>("Mentor approved", p)));
    }

    @Operation(summary = "Reject a mentor profile with a reason")
    @PostMapping("/mentors/{memberId}/reject")
    public Mono<ResponseEntity<ApiResponse<AdminMentorProfileDTO>>> rejectMentor(
            @PathVariable @Min(value = 1, message = "Member ID must be greater than 0") Integer memberId,
            @Valid @RequestBody MentorApplicationReviewRequest request) {
        return adminMentorshipService.rejectMentor(memberId, request.getReason())
                .map(p -> ResponseEntity.ok(new ApiResponse<>("Mentor application rejected", p)));
    }

    @Operation(summary = "Ask the applicant to update the mentor profile, with a reason")
    @PostMapping("/mentors/{memberId}/request-update")
    public Mono<ResponseEntity<ApiResponse<AdminMentorProfileDTO>>> requestMentorUpdate(
            @PathVariable @Min(value = 1, message = "Member ID must be greater than 0") Integer memberId,
            @Valid @RequestBody MentorApplicationReviewRequest request) {
        return adminMentorshipService.requestMentorUpdate(memberId, request.getReason())
                .map(p -> ResponseEntity.ok(new ApiResponse<>("Mentor application needs update", p)));
    }

    @Operation(summary = "Get comprehensive mentorship statistics")
    @GetMapping("/statistics")
    public Mono<ResponseEntity<ApiResponse<MentorshipStatisticsDTO>>> getStatistics() {
        return adminMentorshipService.getStatistics()
                .map(s -> ResponseEntity.ok(new ApiResponse<>("Retrieved mentorship statistics", s)));
    }
}
