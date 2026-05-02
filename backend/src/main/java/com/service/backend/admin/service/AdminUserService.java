package com.service.backend.admin.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.service.backend.admin.dao.AdminAuditLogRepository;
import com.service.backend.admin.dao.AdminUserOrganizationPreviewRepository;
import com.service.backend.admin.dto.CreateAdminRequest;
import com.service.backend.admin.dto.AdminResetPasswordRequest;
import com.service.backend.admin.dto.UserActivityResponse;
import com.service.backend.admin.dto.UpdateUserRequest;
import com.service.backend.admin.dto.UserResponse;
import com.service.backend.admin.dto.VerificationRequestResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.admin.dao.AdminUserRepository;
import com.service.backend.auth.entity.User;
import com.service.backend.admin.entity.AdminAuditLog;
import com.service.backend.shared.dao.UserDisplayInfo;
import com.service.backend.shared.dao.UserDisplayInfoRepository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
public class AdminUserService {
    private static final Logger logger = LoggerFactory.getLogger(AdminUserService.class);
    
    private final AdminUserRepository adminUserRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserDisplayInfoRepository userDisplayInfoRepository;
    private final AdminUserOrganizationPreviewRepository adminUserOrganizationPreviewRepository;

    public AdminUserService(
            AdminUserRepository adminUserRepository,
            AdminAuditLogRepository adminAuditLogRepository,
            PasswordEncoder passwordEncoder,
            UserDisplayInfoRepository userDisplayInfoRepository,
            AdminUserOrganizationPreviewRepository adminUserOrganizationPreviewRepository) {
        this.adminUserRepository = adminUserRepository;
        this.adminAuditLogRepository = adminAuditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.userDisplayInfoRepository = userDisplayInfoRepository;
        this.adminUserOrganizationPreviewRepository = adminUserOrganizationPreviewRepository;
    }
    
    /**
     * Get users in organization with pagination
     */
    public Mono<PaginatedResponse<UserResponse>> getUsersByOrganization(Integer organizationId, int page, int size) {
        logger.info("Fetching users for organization: {} with page: {}, size: {}", organizationId, page, size);
        
        int offset = page * size;

        Mono<Long> totalCount = adminUserRepository.countUsersByOrganization(organizationId);

        return Mono.zip(
                        adminUserRepository.findUsersByOrganizationWithPagination(organizationId, size, offset).collectList(),
                        totalCount)
                .flatMap(tuple -> enrichUserResponses(tuple.getT1())
                        .map(items -> PaginatedResponse.of(items, tuple.getT2(), page, size)))
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

        Mono<Long> totalCount = adminUserRepository.countAllUsers();

        return Mono.zip(adminUserRepository.findAllUsersWithPagination(size, offset).collectList(), totalCount)
                .flatMap(tuple -> enrichUserResponses(tuple.getT1())
                        .map(items -> PaginatedResponse.of(items, tuple.getT2(), page, size)))
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
                .flatMap(this::enrichOne)
                .doOnSuccess(user -> logger.info("Successfully fetched user: {}", userId))
                .doOnError(error -> logger.error("Error fetching user: {}", userId, error));
    }
    
    /**
     * Unban a user by setting status back to ACTIVE
     */
    public Mono<Boolean> unbanUser(Integer userId) {
        logger.info("Unbanning user: {}", userId);
        return adminUserRepository.unbanUserById(userId)
                .map(count -> count > 0)
                .doOnSuccess(ok -> {
                    if (ok) logger.info("User {} unbanned", userId);
                    else logger.warn("User {} not found for unban", userId);
                })
                .doOnError(e -> logger.error("Error unbanning user {}", userId, e));
    }

    /**
     * Update user fields (partial update — only non-null fields are applied)
     */
    public Mono<UserResponse> updateUser(Integer userId, UpdateUserRequest request) {
        logger.info("Updating user: {}", userId);
        return adminUserRepository.findById(userId)
                .flatMap(user -> {
                    if (request.getEmail() != null) user.setEmail(request.getEmail());
                    if (request.getUserName() != null) user.setUserName(request.getUserName());
                    if (request.getRole() != null) user.setRole(request.getRole());
                    if (request.getStatus() != null) user.setStatus(request.getStatus());
                    user.setUpdatedAt(LocalDateTime.now());
                    return adminUserRepository.save(user);
                })
                .flatMap(saved -> applyProfileAndOrg(userId, request).then(getUserById(userId)))
                .doOnSuccess(u -> logger.info("User {} updated successfully", userId))
                .doOnError(e -> logger.error("Error updating user {}", userId, e));
    }

    private Mono<Void> applyProfileAndOrg(Integer userId, UpdateUserRequest request) {
        Mono<Void> profile = Mono.empty();
        if (StringUtils.hasText(request.getFullName())) {
            profile = adminUserRepository
                    .upsertGlobalProfileFullName(userId, request.getFullName().trim())
                    .then();
        }
        Mono<Void> org = Mono.empty();
        if (request.getOrganizationId() != null) {
            org = syncPrimaryOrganization(userId, request.getOrganizationId());
        }
        return Mono.when(profile, org);
    }

    private Mono<Void> syncPrimaryOrganization(Integer userId, Integer organizationId) {
        return adminUserRepository.upsertOrganizationMemberByUserId(organizationId, userId).then();
    }

    private Mono<List<UserResponse>> enrichUserResponses(List<User> users) {
        if (users == null || users.isEmpty()) {
            return Mono.just(List.of());
        }
        List<Integer> ids = users.stream().map(User::getId).toList();
        return Mono.zip(
                        userDisplayInfoRepository.findByUserIds(ids),
                        adminUserOrganizationPreviewRepository.findPrimaryOrgByUserIds(ids))
                .map(tuple -> {
                    var displayMap = tuple.getT1();
                    var orgMap = tuple.getT2();
                    return users.stream()
                            .map(u -> mergeEnrichment(
                                    mapToUserResponse(u),
                                    displayMap.get(u.getId()),
                                    orgMap.get(u.getId())))
                            .toList();
                });
    }

    private Mono<UserResponse> enrichOne(UserResponse base) {
        if (base.getId() == null) {
            return Mono.just(base);
        }
        return Mono.zip(
                        userDisplayInfoRepository.findByUserId(base.getId()).defaultIfEmpty(new UserDisplayInfo()),
                        adminUserOrganizationPreviewRepository.findPrimaryOrgByUserIds(List.of(base.getId())))
                .map(t -> mergeEnrichment(base, t.getT1(), t.getT2().get(base.getId())));
    }

    private UserResponse mergeEnrichment(
            UserResponse base,
            UserDisplayInfo di,
            AdminUserOrganizationPreviewRepository.PrimaryOrg org) {
        UserResponse.UserResponseBuilder b = base.toBuilder();
        if (di != null && StringUtils.hasText(di.getFullName())) {
            b.fullName(di.getFullName());
        }
        if (org != null && org.organizationId() != null) {
            b.organizationId(org.organizationId());
            b.organizationName(org.organizationName());
        }
        return b.build();
    }

    /**
     * Get all verification requests with pagination
     */
    public Mono<PaginatedResponse<VerificationRequestResponse>> getAllVerificationRequests(int page, int size) {
        logger.info("Fetching all verification requests page={} size={}", page, size);
        int offset = page * size;
        return Mono.zip(
                adminUserRepository.findAllVerificationRequests(size, offset).collectList(),
                adminUserRepository.countAllVerificationRequests()
        ).map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, size))
         .doOnError(e -> logger.error("Error fetching verification requests", e));
    }

    /**
     * Get pending verification requests with pagination
     */
    public Mono<PaginatedResponse<VerificationRequestResponse>> getPendingVerificationRequests(int page, int size) {
        logger.info("Fetching pending verification requests page={} size={}", page, size);
        int offset = page * size;
        return Mono.zip(
                adminUserRepository.findPendingVerificationRequests(size, offset).collectList(),
                adminUserRepository.countPendingVerificationRequests()
        ).map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, size))
         .doOnError(e -> logger.error("Error fetching pending verification requests", e));
    }

    /**
     * Approve or reject a verification request
     */
    public Mono<Boolean> reviewVerificationRequest(Integer requestId, String status, String adminNote) {
        logger.info("Reviewing verification request {} with status={}", requestId, status);
        return adminUserRepository.reviewVerificationRequest(requestId, status, adminNote)
                .map(count -> count > 0)
                .doOnSuccess(ok -> {
                    if (ok) logger.info("Verification request {} reviewed as {}", requestId, status);
                    else logger.warn("Verification request {} not found", requestId);
                })
                .doOnError(e -> logger.error("Error reviewing verification request {}", requestId, e));
    }

    public Mono<UserActivityResponse> getUserActivity(Integer userId) {
        return Mono.zip(
                adminUserRepository.findRecentLoginHistories(userId, 50).collectList(),
                adminUserRepository.findRecentVerificationRequests(userId, 50).collectList(),
                adminAuditLogRepository.findRecentByTargetUserId(userId, 50).collectList())
                .map(tuple -> UserActivityResponse.builder()
                        .loginHistories(tuple.getT1())
                        .verificationRequests(tuple.getT2())
                        .adminActions(tuple.getT3())
                        .build());
    }

    public Mono<PaginatedResponse<AdminAuditLog>> getAdminActionLogs(
            Integer adminUserId,
            Integer targetUserId,
            String action,
            int page,
            int size) {
        int offset = page * size;
        return Mono.zip(
                adminAuditLogRepository.findAdminActionLogs(adminUserId, targetUserId, action, size, offset).collectList(),
                adminAuditLogRepository.countAdminActionLogs(adminUserId, targetUserId, action))
                .map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, size))
                .doOnError(e -> logger.error("Error fetching admin action logs", e));
    }

    public Mono<Boolean> resetPasswordByAdmin(Integer userId, AdminResetPasswordRequest request, Integer adminUserId) {
        String encodedPassword = passwordEncoder.encode(request.getNewPassword());
        return adminUserRepository.resetPasswordByAdmin(userId, encodedPassword)
                .flatMap(count -> {
                    if (count <= 0) {
                        return Mono.just(false);
                    }
                    return adminAuditLogRepository.save(com.service.backend.admin.entity.AdminAuditLog.builder()
                                    .adminUserId(adminUserId)
                                    .targetUserId(userId)
                                    .action("RESET_PASSWORD")
                                    .resourceType("USER")
                                    .resourceId(String.valueOf(userId))
                                    .metadata(request.getReason())
                                    .createdAt(LocalDateTime.now())
                                    .build())
                            .thenReturn(true);
                });
    }

    public Mono<Boolean> createAdminAccount(CreateAdminRequest request) {
        logger.info("Creating new admin account for email={}", request.getEmail());
        return adminUserRepository.existsByEmailOrUserName(request.getEmail(), request.getUserName())
                .flatMap(exists -> {
                    if (exists) {
                        return Mono.error(new RuntimeException("Email or username already exists"));
                    }
                    String encodedPassword = passwordEncoder.encode(request.getPassword());
                    return adminUserRepository.createAdminUser(
                                    request.getEmail(),
                                    request.getUserName(),
                                    encodedPassword)
                            .flatMap(adminUserId -> adminUserRepository
                                    .createGlobalProfile(adminUserId, request.getFullName())
                                    .then(adminUserRepository.upsertOrganizationMemberByUserId(
                                            request.getOrganizationId(),
                                            adminUserId))
                                    .thenReturn(true));
                })
                .doOnSuccess(created -> logger.info("Admin account created for email={}", request.getEmail()))
                .doOnError(e -> logger.error("Error creating admin account for email={}", request.getEmail(), e));
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
