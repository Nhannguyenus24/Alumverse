package com.service.backend.admin.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.service.backend.admin.dto.BanUserRequest;
import com.service.backend.admin.dto.AdminResetPasswordRequest;
import com.service.backend.admin.dto.BulkCreateOrganizationMembersRequest;
import com.service.backend.admin.dto.BulkImportResult;
import com.service.backend.admin.dto.CreateAdminRequest;
import com.service.backend.admin.dto.CreateOrganizationMemberRequest;
import com.service.backend.admin.dto.DeleteUserRequest;
import com.service.backend.admin.dto.ReopenVerificationRequest;
import com.service.backend.admin.dto.ReviewVerificationRequest;
import com.service.backend.admin.dto.UnbanUserRequest;
import com.service.backend.admin.dto.UpdateUserRequest;
import com.service.backend.admin.dto.UserGrowthStatisticsDTO;
import com.service.backend.admin.dto.UserResponse;
import com.service.backend.admin.dto.UserActivityResponse;
import com.service.backend.admin.dto.VerificationRequestResponse;
import com.service.backend.admin.dto.VerificationStatisticsDTO;
import com.service.backend.shared.entity.AdminAuditLog;
import com.service.backend.admin.service.AdminUserService;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.SecurityUtils;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import reactor.core.publisher.Mono;

import java.util.List;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;

@Tag(name = "Admin > Users", description = "API endpoints for managing users by administrators")
@RestController
@RequestMapping("/api/admin/users")
@Validated
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminUserController {
    
    private final AdminUserService adminUserService;
    
    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }
    
    /**
     * Get all users with pagination and filters
     */
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<UserResponse>>>> getAllUsers(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer organizationId) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminUserService.getAllUsers(page, size, search, role, status, resolvedOrgId))
                .switchIfEmpty(adminUserService.getAllUsers(page, size, search, role, status, null))
                .map(pagedResponse -> ResponseEntity.ok(
                        new ApiResponse<>("Users fetched successfully", pagedResponse)));
    }
    
    /**
     * Get user by ID
     */
    @GetMapping("/{userId}")
    public Mono<ResponseEntity<ApiResponse<UserResponse>>> getUserById(
            @PathVariable Integer userId) {
        return adminUserService.getUserById(userId)
                .map(user -> ResponseEntity.ok(
                        new ApiResponse<>("User fetched successfully", user)))
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "User not found")));
    }
    
    /**
     * Ban a user
     */
    @PostMapping("/ban")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> banUser(
            @Valid @RequestBody BanUserRequest request) {
        return adminUserService.banUser(request.getUserId())
                .flatMap(success -> {
                    if (success) {
                        return Mono.just(ResponseEntity.ok(
                                new ApiResponse<>("User banned successfully", true)));
                    } else {
                        return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "User not found"));
                    }
                });
    }
    
    /**
     * Delete a user (soft or hard delete)
     */
    @DeleteMapping
    public Mono<ResponseEntity<ApiResponse<Boolean>>> deleteUser(
            @Valid @RequestBody DeleteUserRequest request) {
        return adminUserService.deleteUser(request.getUserId(), request.getHardDelete())
                .flatMap(success -> {
                    if (success) {
                        return Mono.just(ResponseEntity.ok(
                                new ApiResponse<>("User deleted successfully", true)));
                    } else {
                        return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "User not found"));
                    }
                });
    }
    
    /**
     * Get user verification requests
     */
    @GetMapping("/{userId}/verification-requests")
    public Mono<ResponseEntity<ApiResponse<List<Object>>>> getUserVerificationRequests(
            @PathVariable Integer userId) {
        return adminUserService.getUserVerificationRequests(userId)
                .collectList()
                .map(requests -> ResponseEntity.ok(
                        new ApiResponse<>("Verification requests fetched successfully", requests)));
    }
    
    /**
     * Get peer verifications for a user
     */
    @GetMapping("/{userId}/peer-verifications")
    public Mono<ResponseEntity<ApiResponse<List<Object>>>> getPeerVerifications(
            @PathVariable Integer userId) {
        return adminUserService.getPeerVerifications(userId)
                .collectList()
                .map(verifications -> ResponseEntity.ok(
                        new ApiResponse<>("Peer verifications fetched successfully", verifications)));
    }
    
    /**
     * Unban a user
     */
    @PostMapping("/unban")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> unbanUser(
            @Valid @RequestBody UnbanUserRequest request) {
        return adminUserService.unbanUser(request.getUserId())
                .flatMap(success -> {
                    if (success) {
                        return Mono.just(ResponseEntity.ok(
                                new ApiResponse<>("User unbanned successfully", true)));
                    } else {
                        return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "User not found"));
                    }
                });
    }

    /**
     * Update user details (role, status, email, studentId)
     */
    @PutMapping("/{userId}")
    public Mono<ResponseEntity<ApiResponse<UserResponse>>> updateUser(
            @PathVariable Integer userId,
            @Valid @RequestBody UpdateUserRequest request) {
        return adminUserService.updateUser(userId, request)
                .map(user -> ResponseEntity.ok(
                        new ApiResponse<>("User updated successfully", user)))
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "User not found")));
    }

    /**
     * Get all verification requests with optional pending-only and organization filters
     */
    @GetMapping("/verification-requests")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<VerificationRequestResponse>>>> getVerificationRequests(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "false") boolean pendingOnly,
            @RequestParam(required = false) String requestType,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> pendingOnly
                        ? adminUserService.getPendingVerificationRequests(resolvedOrgId, keyword, requestType, page, size)
                        : adminUserService.getAllVerificationRequests(resolvedOrgId, keyword, requestType, page, size))
                .switchIfEmpty(Mono.defer(() -> pendingOnly
                        ? adminUserService.getPendingVerificationRequests(null, keyword, requestType, page, size)
                        : adminUserService.getAllVerificationRequests(null, keyword, requestType, page, size)))
                .map(data -> ResponseEntity.ok(
                        new ApiResponse<>("Verification requests fetched successfully", data)));
    }

    /**
     * Approve or reject a verification request
     */
    @PutMapping("/verification-requests/{requestId}")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> reviewVerificationRequest(
            @PathVariable Integer requestId,
            @Valid @RequestBody ReviewVerificationRequest request) {
        return adminUserService.reviewVerificationRequest(requestId, request.getStatus(), request.getAdminNote())
                .flatMap(success -> {
                    if (success) {
                        return Mono.just(ResponseEntity.ok(
                                new ApiResponse<>("Verification request reviewed successfully", true)));
                    } else {
                        return Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Verification request not found"));
                    }
                });
    }

    @PostMapping("/verification-requests/{requestId}/reopen")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> reopenVerificationRequest(
            @PathVariable Integer requestId,
            @Valid @RequestBody ReopenVerificationRequest request) {
        return adminUserService.reopenVerificationRequest(requestId, request.getRequestType(), request.getAdminNote())
                .flatMap(success -> {
                    if (success) {
                        return Mono.just(ResponseEntity.ok(
                                new ApiResponse<>("Verification request reopened successfully", true)));
                    }
                    return Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Pending verification request not found"));
                });
    }

    /**
     * Add user to organization
     */
    @PostMapping("/organization-member")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> createOrganizationMember(
            @Valid @RequestBody CreateOrganizationMemberRequest request) {
        return adminUserService.createOrganizationMember(
                        request.getOrganizationId(),
                        request.getUserId(),
                        request.getEmail(),
                        request.getFullName(),
                        request.getStudentId(),
                        request.getRole(),
                        request.getAvatarUrl(),
                        request.getPassword(),
                        request.getFaculty(),
                        request.getStartedYear(),
                        request.getGraduatedYear(),
                        request.getGraduationStatus(),
                        request.getProgram(),
                        request.getMajor(),
                        request.getDepartment(),
                        request.getVerificationLevel(),
                        request.getIsTrustedVerifier(),
                        request.getStatus())
                .flatMap(success -> {
                    if (success) {
                        return Mono.just(ResponseEntity.status(HttpStatus.CREATED)
                                .body(new ApiResponse<>("User added to organization successfully", true)));
                    } else {
                        return Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Failed to add user to organization"));
                    }
                });
    }

    @PostMapping("/organization-members/bulk")
    public Mono<ResponseEntity<ApiResponse<BulkImportResult>>> bulkCreateOrganizationMembers(
            @Valid @RequestBody BulkCreateOrganizationMembersRequest request) {
        return adminUserService.bulkCreateOrganizationMembers(request)
                .map(result -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Bulk import completed", result)));
    }

    @PatchMapping("/{userId}/organizations/{organizationId}/trusted-verifier")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> updateIsTrustedVerifier(
            @PathVariable Integer userId,
            @PathVariable Integer organizationId,
            @RequestParam boolean isTrusted) {
        return adminUserService.updateIsTrustedVerifier(userId, organizationId, isTrusted)
                .flatMap(success -> {
                    if (success) {
                        return Mono.just(ResponseEntity.ok(
                                new ApiResponse<>("User trusted verifier status updated successfully", true)));
                    } else {
                        return Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Member record not found"));
                    }
                });
    }

    @GetMapping("/{userId}/activity")
    public Mono<ResponseEntity<ApiResponse<UserActivityResponse>>> getUserActivity(
            @PathVariable Integer userId) {
        return adminUserService.getUserActivity(userId)
                .map(activity -> ResponseEntity.ok(
                        new ApiResponse<>("User activity fetched successfully", activity)));
    }

    @PostMapping("/{userId}/reset-password")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> resetPasswordByAdmin(
            @PathVariable Integer userId,
            @Valid @RequestBody AdminResetPasswordRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(adminId -> adminUserService.resetPasswordByAdmin(userId, request, adminId.intValue()))
                .flatMap(success -> {
                    if (success) {
                        return Mono.just(ResponseEntity.ok(
                                new ApiResponse<>("Password reset successfully", true)));
                    }
                    return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "User not found"));
                });
    }

    @PostMapping("/admins")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> createAdminAccount(
            @Valid @RequestBody CreateAdminRequest request) {
        return adminUserService.createAdminAccount(request)
                .map(success -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Admin account created successfully", success)));
    }

    @GetMapping("/alumni/verification-requests")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<VerificationRequestResponse>>>> getAlumniVerificationRequests(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "true") boolean pendingOnly,
            @RequestParam(required = false) String requestType,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size) {
        return getVerificationRequests(organizationId, keyword, pendingOnly, requestType, page, size);
    }

    @PutMapping("/alumni/verification-requests/{requestId}")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> reviewAlumniVerificationRequest(
            @PathVariable Integer requestId,
            @Valid @RequestBody ReviewVerificationRequest request) {
        return reviewVerificationRequest(requestId, request);
    }

    @PostMapping("/alumni/verification-requests/{requestId}/reopen")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> reopenAlumniVerificationRequest(
            @PathVariable Integer requestId,
            @Valid @RequestBody ReopenVerificationRequest request) {
        return reopenVerificationRequest(requestId, request);
    }

    @GetMapping("/growth-statistics")
    public Mono<ResponseEntity<ApiResponse<UserGrowthStatisticsDTO>>> getUserGrowthStatistics() {
        return adminUserService.getUserGrowthStatistics()
                .map(stats -> ResponseEntity.ok(
                        new ApiResponse<>("User growth statistics fetched successfully", stats)));
    }

    @GetMapping("/verification-statistics")
    public Mono<ResponseEntity<ApiResponse<VerificationStatisticsDTO>>> getVerificationStatistics() {
        return adminUserService.getVerificationStatistics()
                .map(stats -> ResponseEntity.ok(
                        new ApiResponse<>("Verification statistics fetched successfully", stats)));
    }

    /**
     * Get admin action logs with optional filters
     */
    @GetMapping("/admin-actions")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AdminAuditLog>>>> getAdminActionLogs(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(required = false) Integer adminUserId,
            @RequestParam(required = false) Integer targetUserId,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminUserService.getAdminActionLogs(resolvedOrgId, adminUserId, targetUserId, action, page, size))
                .switchIfEmpty(adminUserService.getAdminActionLogs(null, adminUserId, targetUserId, action, page, size))
                .map(data -> ResponseEntity.ok(
                        new ApiResponse<>("Admin action logs fetched successfully", data)));
    }

    /**
     * Get action logs performed by a specific admin
     */
    @GetMapping("/{adminUserId}/admin-actions")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AdminAuditLog>>>> getAdminActionLogsByAdmin(
            @PathVariable Integer adminUserId,
            @RequestParam(required = false) Integer targetUserId,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size) {
        return adminUserService.getAdminActionLogs(adminUserId, targetUserId, action, page, size)
                .map(data -> ResponseEntity.ok(
                        new ApiResponse<>("Admin action logs fetched successfully", data)));
    }
}
