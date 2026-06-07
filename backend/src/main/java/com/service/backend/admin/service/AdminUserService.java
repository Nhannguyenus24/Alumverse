package com.service.backend.admin.service;

import java.util.List;

import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.user.dao.UserOrganizationMemberRepository;
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
import com.service.backend.admin.dto.UserGrowthStatisticsDTO;
import com.service.backend.admin.dto.UserResponse;
import com.service.backend.admin.dto.VerificationRequestResponse;
import com.service.backend.admin.dto.VerificationStatisticsDTO;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.admin.dao.AdminUserRepository;
import com.service.backend.shared.entity.User;
import com.service.backend.shared.entity.AdminAuditLog;
import com.service.backend.shared.dao.UserDisplayInfo;
import com.service.backend.shared.dao.UserDisplayInfoRepository;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminUserService {
    private static final Logger logger = LoggerFactory.getLogger(AdminUserService.class);

    private final AdminUserRepository adminUserRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserDisplayInfoRepository userDisplayInfoRepository;
    private final AdminUserOrganizationPreviewRepository adminUserOrganizationPreviewRepository;
    private final UserOrganizationMemberRepository userOrganizationMemberRepository;

    public Mono<PaginatedResponse<UserResponse>> getUsersByOrganization(Integer organizationId, int page, int size) {
        int offset = page * size;
        Mono<Long> totalCount = adminUserRepository.countUsersByOrganization(organizationId);

        return Mono.zip(
                        adminUserRepository.findUsersByOrganizationWithPagination(organizationId, size, offset).collectList(),
                        totalCount)
                .flatMap(tuple -> enrichUserResponses(tuple.getT1())
                        .map(items -> PaginatedResponse.of(items, tuple.getT2(), page, size)))
                .doOnSuccess(r -> logger.info("getUsersByOrganization result: {}", JsonUtils.toJson(r)))
                .doOnError(error -> logger.error("Error fetching users for organization: {}", organizationId, error));
    }

    public Mono<PaginatedResponse<UserResponse>> getAllUsers(int page, int size, String search, String role, String status, Integer organizationId) {
        int offset = page * size;
        String searchParam = (search != null && !search.trim().isEmpty()) ? "%" + search.trim() + "%" : null;
        String roleParam = (role != null && !role.equals("ALL")) ? role : null;
        String statusParam = (status != null && !status.equals("ALL")) ? status.toUpperCase() : null;

        Mono<Long> totalCount = adminUserRepository.countUsersWithFilters(searchParam, roleParam, statusParam, organizationId);

        return Mono.zip(
                adminUserRepository.findUsersWithFilters(searchParam, roleParam, statusParam, organizationId, size, offset).collectList(),
                totalCount)
                .flatMap(tuple -> enrichUserResponses(tuple.getT1())
                        .map(items -> PaginatedResponse.of(items, tuple.getT2(), page, size)))
                .doOnSuccess(r -> logger.info("getAllUsers result: {}", JsonUtils.toJson(r)))
                .doOnError(error -> logger.error("Error fetching users with filters", error));
    }

    public Mono<Boolean> banUser(Integer userId) {
        return adminUserRepository.banUserById(userId)
                .map(count -> count > 0)
                .doOnSuccess(success -> logger.info("banUser: userId={}, success={}", userId, success))
                .doOnError(error -> logger.error("Error banning user: {}", userId, error));
    }

    public Mono<Boolean> deleteUser(Integer userId, boolean hardDelete) {
        if (hardDelete) {
            return adminUserRepository.hardDeleteUserById(userId)
                    .thenReturn(true)
                    .doOnSuccess(success -> logger.info("deleteUser: userId={}, hardDelete=true", userId))
                    .doOnError(error -> logger.error("Error hard deleting user: {}", userId, error))
                    .onErrorReturn(false);
        } else {
            return adminUserRepository.softDeleteUserById(userId)
                    .map(count -> count > 0)
                    .doOnSuccess(success -> logger.info("deleteUser: userId={}, hardDelete=false, success={}", userId, success))
                    .doOnError(error -> logger.error("Error soft deleting user: {}", userId, error));
        }
    }

    public Flux<Object> getUserVerificationRequests(Integer userId) {
        return adminUserRepository.findVerificationRequestsByUserId(userId)
                .doOnError(error -> logger.error("Error fetching verification requests for user: {}", userId, error));
    }

    public Flux<Object> getPeerVerifications(Integer userId) {
        return adminUserRepository.findPeerVerificationsByUserId(userId)
                .doOnError(error -> logger.error("Error fetching peer verifications for user: {}", userId, error));
    }

    public Mono<Boolean> createOrganizationMember(Integer organizationId, Integer userId,
                               List<Integer> graduatedYear, List<String> graduationStatus,
                               List<String> program, List<String> major,
                                                   Integer verificationLevel, String status) {
        String upperStatus = status == null ? null : status.toUpperCase();
        String graduatedYearJson = JsonUtils.toJson(graduatedYear);
        String graduationStatusJson = JsonUtils.toJson(graduationStatus);
        String programJson = JsonUtils.toJson(program);
        String majorJson = JsonUtils.toJson(major);

        return adminUserRepository.existsOrganizationMemberByUserId(userId)
            .flatMap(exists -> exists
                ? adminUserRepository.updateOrganizationMemberByUserId(
                    organizationId,
                    userId,
                    graduatedYearJson,
                    graduationStatusJson,
                    programJson,
                    majorJson,
                    verificationLevel,
                    upperStatus)
                : adminUserRepository.createOrganizationMember(
                    organizationId,
                    userId,
                    graduatedYearJson,
                    graduationStatusJson,
                    programJson,
                    majorJson,
                    verificationLevel,
                    upperStatus))
                .map(count -> count > 0)
                .doOnSuccess(success -> logger.info("createOrganizationMember: userId={}, organizationId={}, success={}", userId, organizationId, success))
                .doOnError(error -> logger.error("Error adding user {} to organization {}", userId, organizationId, error));
    }

    public Mono<UserResponse> getUserById(Integer userId) {
        return adminUserRepository.findById(userId)
                .map(this::mapToUserResponse)
                .flatMap(this::enrichOne)
                .doOnSuccess(user -> logger.info("getUserById result: {}", JsonUtils.toJson(user)))
                .doOnError(error -> logger.error("Error fetching user: {}", userId, error));
    }

    public Mono<Boolean> unbanUser(Integer userId) {
        return adminUserRepository.unbanUserById(userId)
                .map(count -> count > 0)
                .doOnSuccess(ok -> logger.info("unbanUser: userId={}, success={}", userId, ok))
                .doOnError(e -> logger.error("Error unbanning user {}", userId, e));
    }

    public Mono<UserResponse> updateUser(Integer userId, UpdateUserRequest request) {
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
                .doOnSuccess(u -> logger.info("updateUser result: {}", JsonUtils.toJson(u)))
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

    public Mono<PaginatedResponse<VerificationRequestResponse>> getAllVerificationRequests(int page, int size) {
        int offset = page * size;
        return Mono.zip(
                adminUserRepository.findAllVerificationRequests(size, offset).collectList(),
                adminUserRepository.countAllVerificationRequests()
        ).map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, size))
         .doOnSuccess(r -> logger.info("getAllVerificationRequests result: {}", JsonUtils.toJson(r)))
         .doOnError(e -> logger.error("Error fetching verification requests", e));
    }

    public Mono<PaginatedResponse<VerificationRequestResponse>> getPendingVerificationRequests(int page, int size) {
        int offset = page * size;
        return Mono.zip(
                adminUserRepository.findPendingVerificationRequests(size, offset).collectList(),
                adminUserRepository.countPendingVerificationRequests()
        ).map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, size))
         .doOnSuccess(r -> logger.info("getPendingVerificationRequests result: {}", JsonUtils.toJson(r)))
         .doOnError(e -> logger.error("Error fetching pending verification requests", e));
    }

    public Mono<Boolean> reviewVerificationRequest(Integer requestId, String status, String adminNote) {
        String upperStatus = status == null ? null : status.toUpperCase();
        return adminUserRepository.findMemberIdByRequestId(requestId)
                .flatMap(memberId -> adminUserRepository.reviewVerificationRequest(requestId, Status.valueOf(upperStatus).getValue(), adminNote)
                        .flatMap(count -> {
                            if (count <= 0) return Mono.just(false);
                            
                            if ("APPROVED".equals(upperStatus)) {
                                return userOrganizationMemberRepository.incrementVerificationLevelByUserId(memberId)
                                        .thenReturn(true);
                            }
                            return Mono.just(true);
                        }))
                .doOnSuccess(ok -> logger.info("reviewVerificationRequest: requestId={}, status={}, success={}", requestId, upperStatus, ok))
                .doOnError(e -> logger.error("Error reviewing verification request {}", requestId, e))
                .defaultIfEmpty(false);
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
                        .build())
                .doOnSuccess(r -> logger.info("getUserActivity result: {}", JsonUtils.toJson(r)));
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
                .doOnSuccess(r -> logger.info("getAdminActionLogs result: {}", JsonUtils.toJson(r)))
                .doOnError(e -> logger.error("Error fetching admin action logs", e));
    }

    public Mono<Boolean> resetPasswordByAdmin(Integer userId, AdminResetPasswordRequest request, Integer adminUserId) {
        String encodedPassword = passwordEncoder.encode(request.getNewPassword());
        return adminUserRepository.resetPasswordByAdmin(userId, encodedPassword)
                .flatMap(count -> {
                    if (count <= 0) {
                        return Mono.just(false);
                    }
                    return adminAuditLogRepository
                            .insertAuditLog(
                                    adminUserId,
                                    userId,
                                    "RESET_PASSWORD",
                                    "USER",
                                    String.valueOf(userId),
                                    null,
                                    null,
                                    request.getReason())
                            .onErrorResume(primaryErr -> {
                                logger.warn("Primary audit-log insert failed, retrying legacy schema for user {}", userId, primaryErr);
                                return adminAuditLogRepository
                                        .insertAuditLogLegacy(
                                                adminUserId,
                                                userId,
                                                "RESET_PASSWORD");
                            })
                            .thenReturn(true)
                            .onErrorResume(e -> {
                                logger.warn("Password reset succeeded but all audit-log insert attempts failed for user {}", userId, e);
                                return Mono.just(true);
                            });
                });
    }

    public Mono<Boolean> createAdminAccount(CreateAdminRequest request) {
        return adminUserRepository.existsByEmailOrUserName(request.getEmail(), request.getUserName())
                .flatMap(exists -> {
                    if (exists) {
                        return Mono.error(new ApplicationException(ErrorCode.EMAIL_OR_USERNAME_ALREADY_REGISTERED));
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
                .doOnSuccess(created -> logger.info("createAdminAccount: email={}, success={}", request.getEmail(), created))
                .doOnError(e -> logger.error("Error creating admin account for email={}", request.getEmail(), e));
    }

    public Mono<Boolean> updateIsTrustedVerifier(Integer userId, Integer organizationId, boolean isTrusted) {
        logger.info("Updating is_trusted_verifier for user {} in organization {} to {}", userId, organizationId, isTrusted);
        return adminUserRepository.updateIsTrustedVerifier(userId, organizationId, isTrusted)
                .map(count -> count > 0)
                .doOnSuccess(success -> {
                    if (success) {
                        logger.info("Successfully updated is_trusted_verifier for user {} in organization {}", userId, organizationId);
                    } else {
                        logger.warn("Failed to update is_trusted_verifier: Member record not found for user {} and organization {}", userId, organizationId);
                    }
                })
                .doOnError(error -> logger.error("Error updating is_trusted_verifier for user {} and organization {}", userId, organizationId, error));
    }

    public Mono<UserGrowthStatisticsDTO> getUserGrowthStatistics() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime sevenDaysAgo = now.minusDays(7);
        java.time.LocalDateTime thirtyDaysAgo = now.minusDays(30);

        return Mono.zip(
                adminUserRepository.countUsersSince(sevenDaysAgo),
                adminUserRepository.countUsersSince(thirtyDaysAgo),
                adminUserRepository.countUsersByStatus("ACTIVE"),
                adminUserRepository.countUsersByStatus("BANNED"),
                adminUserRepository.countUsersByStatus("DELETED"),
                adminUserRepository.getDailyUserRegistrations()
                        .map(p -> UserGrowthStatisticsDTO.DayCount.builder()
                                .date(p.getDate() != null ? p.getDate().toString() : "")
                                .count(p.getCount() != null ? p.getCount() : 0L)
                                .build())
                        .collectList()
        ).map(t -> UserGrowthStatisticsDTO.builder()
                .newUsersLast7Days(t.getT1())
                .newUsersLast30Days(t.getT2())
                .totalActiveUsers(t.getT3())
                .totalBannedUsers(t.getT4())
                .totalDeletedUsers(t.getT5())
                .dailyRegistrations(t.getT6())
                .build())
                .doOnSuccess(r -> logger.info("getUserGrowthStatistics completed"))
                .doOnError(e -> logger.error("Error fetching user growth statistics", e));
    }

    public Mono<VerificationStatisticsDTO> getVerificationStatistics() {
        return Mono.zip(
                adminUserRepository.countAllVerificationRequests(),
                adminUserRepository.countVerificationRequestsByStatus("PENDING"),
                adminUserRepository.countVerificationRequestsByStatus("APPROVED"),
                adminUserRepository.countVerificationRequestsByStatus("REJECTED"),
                adminUserRepository.countVerificationRequestsByStatus("NEEDS_REVISION"),
                adminUserRepository.countAllPeerVerifications(),
                adminUserRepository.countPeerVerificationsByStatus("PENDING"),
                adminUserRepository.countPeerVerificationsByStatus("APPROVED")
        ).map(t -> VerificationStatisticsDTO.builder()
                .totalAlumniVerificationRequests(t.getT1())
                .pendingAlumniRequests(t.getT2())
                .approvedAlumniRequests(t.getT3())
                .rejectedAlumniRequests(t.getT4())
                .needsRevisionRequests(t.getT5())
                .totalPeerVerifications(t.getT6())
                .pendingPeerVerifications(t.getT7())
                .approvedPeerVerifications(t.getT8())
                .build())
                .doOnSuccess(r -> logger.info("getVerificationStatistics completed"))
                .doOnError(e -> logger.error("Error fetching verification statistics", e));
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
