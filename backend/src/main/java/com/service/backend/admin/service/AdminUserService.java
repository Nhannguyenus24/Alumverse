package com.service.backend.admin.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.service.backend.admin.dto.UserResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.admin.dao.AdminUserRepository;
import com.service.backend.auth.entity.User;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class AdminUserService {
    private static final Logger logger = LoggerFactory.getLogger(AdminUserService.class);
    
    private final AdminUserRepository adminUserRepository;
    
    public AdminUserService(AdminUserRepository adminUserRepository) {
        this.adminUserRepository = adminUserRepository;
    }
    
    /**
     * Get users in organization with pagination
     */
    public Mono<PaginatedResponse<UserResponse>> getUsersByOrganization(Integer organizationId, int page, int size) {
        logger.info("Fetching users for organization: {} with page: {}, size: {}", organizationId, page, size);
        
        int offset = page * size;
        
        Flux<UserResponse> usersFlux = adminUserRepository
                .findUsersByOrganizationWithPagination(organizationId, size, offset)
                .map(this::mapToUserResponse);
        
        Mono<Long> totalCount = adminUserRepository.countUsersByOrganization(organizationId);
        
        return Mono.zip(usersFlux.collectList(), totalCount)
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size))
                .doOnSuccess(response -> logger.info("Successfully fetched {} users from organization {}", 
                        response.getItems().size(), organizationId))
                .doOnError(error -> logger.error("Error fetching users for organization: {}", organizationId, error));
    }
    
    /**
     * Get all users with pagination
     */
    public Mono<PaginatedResponse<UserResponse>> getAllUsers(int page, int size) {
        logger.info("Fetching all users with page: {}, size: {}", page, size);
        
        int offset = page * size;
        
        Flux<UserResponse> usersFlux = adminUserRepository
                .findAllUsersWithPagination(size, offset)
                .map(this::mapToUserResponse);
        
        Mono<Long> totalCount = adminUserRepository.countAllUsers();
        
        return Mono.zip(usersFlux.collectList(), totalCount)
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size))
                .doOnSuccess(response -> logger.info("Successfully fetched {} users", response.getItems().size()))
                .doOnError(error -> logger.error("Error fetching all users", error));
    }
    
    /**
     * Ban a user by ID
     */
    public Mono<Boolean> banUser(Integer userId) {
        logger.info("Attempting to ban user with ID: {}", userId);
        
        return adminUserRepository.banUserById(userId)
                .map(count -> count > 0)
                .doOnSuccess(success -> {
                    if (success) {
                        logger.info("User {} banned successfully", userId);
                    } else {
                        logger.warn("User {} not found for banning", userId);
                    }
                })
                .doOnError(error -> logger.error("Error banning user: {}", userId, error));
    }
    
    /**
     * Delete a user (soft or hard delete)
     */
    public Mono<Boolean> deleteUser(Integer userId, boolean hardDelete) {
        logger.info("Attempting to {} delete user with ID: {}", hardDelete ? "hard" : "soft", userId);
        
        if (hardDelete) {
            return adminUserRepository.hardDeleteUserById(userId)
                    .thenReturn(true)
                    .doOnSuccess(success -> logger.info("User {} hard deleted successfully", userId))
                    .doOnError(error -> logger.error("Error hard deleting user: {}", userId, error))
                    .onErrorReturn(false);
        } else {
            return adminUserRepository.softDeleteUserById(userId)
                    .map(count -> count > 0)
                    .doOnSuccess(success -> {
                        if (success) {
                            logger.info("User {} soft deleted successfully", userId);
                        } else {
                            logger.warn("User {} not found for soft deletion", userId);
                        }
                    })
                    .doOnError(error -> logger.error("Error soft deleting user: {}", userId, error));
        }
    }
    
    /**
     * Get user verification requests
     */
    public Flux<Object> getUserVerificationRequests(Integer userId) {
        logger.info("Fetching verification requests for user: {}", userId);
        
        return adminUserRepository.findVerificationRequestsByUserId(userId)
                .doOnComplete(() -> logger.info("Successfully fetched verification requests for user: {}", userId))
                .doOnError(error -> logger.error("Error fetching verification requests for user: {}", userId, error));
    }
    
    /**
     * Get peer verifications for a user
     */
    public Flux<Object> getPeerVerifications(Integer userId) {
        logger.info("Fetching peer verifications for user: {}", userId);
        
        return adminUserRepository.findPeerVerificationsByUserId(userId)
                .doOnComplete(() -> logger.info("Successfully fetched peer verifications for user: {}", userId))
                .doOnError(error -> logger.error("Error fetching peer verifications for user: {}", userId, error));
    }
    
    /**
     * Create organization member
     */
    public Mono<Boolean> createOrganizationMember(Integer organizationId, Integer userId, 
                               Integer graduatedYear, String graduationStatus,
                               String program, String major,
                                                   Integer verificationLevel, String status) {
        logger.info("Adding user {} to organization {} with verification level {}", 
                userId, organizationId, verificationLevel);
        
        return adminUserRepository.createOrganizationMember(
                organizationId,
                userId,
                graduatedYear,
                graduationStatus,
                program,
                major,
                verificationLevel,
                status)
                .map(count -> count > 0)
                .doOnSuccess(success -> {
                    if (success) {
                        logger.info("User {} added to organization {} successfully", userId, organizationId);
                    } else {
                        logger.warn("Failed to add user {} to organization {}", userId, organizationId);
                    }
                })
                .doOnError(error -> logger.error("Error adding user {} to organization {}", 
                        userId, organizationId, error));
    }
    
    /**
     * Get user by ID
     */
    public Mono<UserResponse> getUserById(Integer userId) {
        logger.info("Fetching user by ID: {}", userId);
        
        return adminUserRepository.findById(userId)
                .map(this::mapToUserResponse)
                .doOnSuccess(user -> logger.info("Successfully fetched user: {}", userId))
                .doOnError(error -> logger.error("Error fetching user: {}", userId, error));
    }
    
    /**
     * Map User entity to UserResponse DTO
     */
    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .userName(user.getUserName())
                .status(user.getStatus())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
