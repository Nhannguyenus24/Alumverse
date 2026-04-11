package com.service.backend.user.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.user.dto.JoinOrganizationRequest;
import com.service.backend.user.dto.OrganizationMembershipResponse;
import com.service.backend.user.dto.UserProfileResponse;
import com.service.backend.user.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import reactor.core.publisher.Mono;
import java.util.List;

/**
 * Controller for user profile and organization membership endpoints
 * 
 * All endpoints require authentication (Bearer token in Authorization header)
 */
@RestController
@RequestMapping("/api/user")
@Validated
@Tag(name = "User", description = "User profile and organization membership APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    /**
     * Get current user profile (from access token)
     * 
     * @return User profile including global profile data
     */
    @GetMapping("/profile")
    @Operation(summary = "Get current user profile", description = "Get profile of authenticated user")
    public Mono<ResponseEntity<ApiResponse<UserProfileResponse>>> getUserProfile() {
        
        return ReactiveSecurityContextHolder.getContext()
                .flatMap(context -> {
                    Authentication auth = context.getAuthentication();
                    if (auth == null) {
                        return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(new ApiResponse<UserProfileResponse>("User not authenticated", null)));
                    }
                    
                    try {
                        String userIdStr = (String) auth.getPrincipal();
                        Integer userId = Integer.parseInt(userIdStr);
                        
                        return userService.getUserProfile(userId)
                                .map(profile -> ResponseEntity.ok(
                                        new ApiResponse<>("User profile fetched successfully", profile)))
                                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(new ApiResponse<>(error.getMessage(), null))));
                    } catch (Exception e) {
                        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(new ApiResponse<UserProfileResponse>("Invalid user ID in token", null)));
                    }
                })
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<>("User not authenticated", null))));
    }
    
    /**
     * Get all organizations the user belongs to
     * 
     * @return List of organization memberships
     */
    @GetMapping("/organizations")
    @Operation(summary = "Get user's organizations", description = "Get all organizations that the authenticated user is member of")
    public Mono<ResponseEntity<ApiResponse<List<OrganizationMembershipResponse>>>> getUserOrganizations() {
        
        return ReactiveSecurityContextHolder.getContext()
                .flatMap(context -> {
                    try {
                        Integer userId = extractUserIdFromContext(context);
                        return userService.getUserOrganizations(userId)
                                .collectList()
                                .map(organizations -> ResponseEntity.ok(
                                        new ApiResponse<List<OrganizationMembershipResponse>>("User organizations fetched successfully", 
                                                organizations)))
                                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(new ApiResponse<List<OrganizationMembershipResponse>>(error.getMessage(), null))));
                    } catch (Exception e) {
                        return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(new ApiResponse<List<OrganizationMembershipResponse>>("User not authenticated", null)));
                    }
                })
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<List<OrganizationMembershipResponse>>("User not authenticated", null))));
    }
    
    /**
     * Check if user is member of specific organization
     * 
     * @param organizationId Organization ID to check
     * @return True if user is member, false otherwise
     */
    @GetMapping("/organizations/{organizationId}/membership")
    @Operation(summary = "Check organization membership", description = "Check if user is member of the specified organization")
        public Mono<ResponseEntity<ApiResponse<String>>> checkOrganizationMembership(
            @PathVariable @Parameter(description = "Organization ID") Integer organizationId) {
        
        return ReactiveSecurityContextHolder.getContext()
                .flatMap(context -> {
                    try {
                        Integer userId = extractUserIdFromContext(context);
                        return userService.isUserMemberOfOrganization(userId, organizationId)
                                .map(isMember -> ResponseEntity.ok(
                                        new ApiResponse<String>("Membership check completed", 
                                                isMember ? "User is a member" : "User is not a member")))
                                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(new ApiResponse<String>(error.getMessage(), null))));
                    } catch (Exception e) {
                        return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(new ApiResponse<String>("User not authenticated", null)));
                    }
                })
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<String>("User not authenticated", null))));
    }
    
    /**
     * Get membership details for a specific organization
     * 
     * @param organizationId Organization ID
     * @return Membership details
     */
    @GetMapping("/organizations/{organizationId}/details")
    @Operation(summary = "Get organization membership details", description = "Get detailed membership information for a specific organization")
    public Mono<ResponseEntity<ApiResponse<OrganizationMembershipResponse>>> getOrganizationMembershipDetails(
            @PathVariable @Parameter(description = "Organization ID") Integer organizationId) {
        
        return ReactiveSecurityContextHolder.getContext()
                .flatMap(context -> {
                    try {
                        Integer userId = extractUserIdFromContext(context);
                        return userService.getOrganizationMembership(userId, organizationId)
                                .map(membership -> ResponseEntity.ok(
                                        new ApiResponse<OrganizationMembershipResponse>("Membership details fetched successfully", membership)))
                                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(new ApiResponse<OrganizationMembershipResponse>(error.getMessage(), null))));
                    } catch (Exception e) {
                        return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(new ApiResponse<OrganizationMembershipResponse>("User not authenticated", null)));
                    }
                })
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<OrganizationMembershipResponse>("User not authenticated", null))));
    }
    
    /**
     * Join user to an organization
     * Creates organization member record if user is not already member
     * 
     * Called during organization registration/onboarding flow
     * 
     * @param request Organization join request with organization ID and optional academic info
     * @return Newly created membership details
     */
    @PostMapping("/organizations/join")
    @Operation(summary = "Join organization", description = "Join user to an organization (register/onboard)")
    public Mono<ResponseEntity<ApiResponse<OrganizationMembershipResponse>>> joinOrganization(
            @Valid @RequestBody JoinOrganizationRequest request) {
        
        return ReactiveSecurityContextHolder.getContext()
                .flatMap(context -> {
                    try {
                        Integer userId = extractUserIdFromContext(context);
                        return userService.joinOrganization(userId, request)
                                .map(membership -> ResponseEntity.status(HttpStatus.CREATED)
                                        .body(new ApiResponse<OrganizationMembershipResponse>("User joined organization successfully", membership)))
                                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(new ApiResponse<OrganizationMembershipResponse>(error.getMessage(), null))));
                    } catch (Exception e) {
                        return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(new ApiResponse<OrganizationMembershipResponse>("User not authenticated", null)));
                    }
                })
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<OrganizationMembershipResponse>("User not authenticated", null))));
    }
    
    /**
     * Extract user ID from security context
     * 
     * @param context Security context
     * @return User ID as Integer
     * @throws IllegalArgumentException if user is not authenticated or principal is invalid
     */
    private Integer extractUserIdFromContext(org.springframework.security.core.context.SecurityContext context) {
        Authentication auth = context.getAuthentication();
        if (auth == null) {
            throw new IllegalArgumentException("User not authenticated");
        }
        
        try {
            String userIdStr = (String) auth.getPrincipal();
            return Integer.parseInt(userIdStr);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid user ID in token: " + e.getMessage());
        }
    }
}
