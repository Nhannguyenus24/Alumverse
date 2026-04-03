package com.service.backend.admin.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.service.backend.admin.dto.BanUserRequest;
import com.service.backend.admin.dto.CreateOrganizationMemberRequest;
import com.service.backend.admin.dto.DeleteUserRequest;
import com.service.backend.admin.dto.UserResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.admin.service.AdminUserService;
import com.service.backend.shared.dto.ApiResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@Validated
public class AdminUserController {
    
    private final AdminUserService adminUserService;
    
    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }
    
    /**
     * Get all users with pagination
     */
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<UserResponse>>>> getAllUsers(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size) {
        return adminUserService.getAllUsers(page, size)
                .map(pagedResponse -> ResponseEntity.ok(
                        new ApiResponse<>("Users fetched successfully", pagedResponse)))
                .onErrorResume(error -> Mono.just(
                        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>(error.getMessage(), null))));
    }
    
    /**
     * Get users by organization with pagination
     */
    @GetMapping("/organization/{organizationId}")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<UserResponse>>>> getUsersByOrganization(
            @PathVariable Integer organizationId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size) {
        return adminUserService.getUsersByOrganization(organizationId, page, size)
                .map(pagedResponse -> ResponseEntity.ok(
                        new ApiResponse<>("Users fetched successfully", pagedResponse)))
                .onErrorResume(error -> Mono.just(
                        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>(error.getMessage(), null))));
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
                .switchIfEmpty(Mono.just(
                        ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(new ApiResponse<>("User not found", null))))
                .onErrorResume(error -> Mono.just(
                        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>(error.getMessage(), null))));
    }
    
    /**
     * Ban a user
     */
    @PostMapping("/ban")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> banUser(
            @Valid @RequestBody BanUserRequest request) {
        return adminUserService.banUser(request.getUserId())
                .map(success -> {
                    if (success) {
                        return ResponseEntity.ok(
                                new ApiResponse<>("User banned successfully", true));
                    } else {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(new ApiResponse<>("User not found", false));
                    }
                })
                .onErrorResume(error -> Mono.just(
                        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>(error.getMessage(), false))));
    }
    
    /**
     * Delete a user (soft or hard delete)
     */
    @DeleteMapping
    public Mono<ResponseEntity<ApiResponse<Boolean>>> deleteUser(
            @Valid @RequestBody DeleteUserRequest request) {
        return adminUserService.deleteUser(request.getUserId(), request.getHardDelete())
                .map(success -> {
                    if (success) {
                        return ResponseEntity.ok(
                                new ApiResponse<>("User deleted successfully", true));
                    } else {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(new ApiResponse<>("User not found", false));
                    }
                })
                .onErrorResume(error -> Mono.just(
                        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>(error.getMessage(), false))));
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
                        new ApiResponse<>("Verification requests fetched successfully", requests)))
                .onErrorResume(error -> Mono.just(
                        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>(error.getMessage(), null))));
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
                        new ApiResponse<>("Peer verifications fetched successfully", verifications)))
                .onErrorResume(error -> Mono.just(
                        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>(error.getMessage(), null))));
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
                        request.getVerificationLevel(),
                        request.getStatus())
                .map(success -> {
                    if (success) {
                        return ResponseEntity.status(HttpStatus.CREATED)
                                .body(new ApiResponse<>("User added to organization successfully", true));
                    } else {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(new ApiResponse<>("Failed to add user to organization", false));
                    }
                })
                .onErrorResume(error -> Mono.just(
                        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>(error.getMessage(), false))));
    }
}
