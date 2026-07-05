package com.service.backend.admin.service;

import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Collection;

import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.enums.UserRole;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.user.dao.UserOrganizationMemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.service.backend.admin.dao.AdminAuditLogRepository;
import com.service.backend.admin.dto.BulkCreateOrganizationMembersRequest;
import com.service.backend.admin.dto.BulkImportResult;
import com.service.backend.admin.dto.CreateAdminRequest;
import com.service.backend.admin.dto.AdminResetPasswordRequest;
import com.service.backend.admin.dto.UserActivityResponse;
import com.service.backend.admin.dto.UpdateUserRequest;
import com.service.backend.admin.dto.UserGrowthStatisticsDTO;
import com.service.backend.admin.dto.UserResponse;
import com.service.backend.admin.dto.VerificationRequestResponse;
import com.service.backend.admin.dto.VerificationStatisticsDTO;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.admin.dao.AdminUserRepository;
import com.service.backend.shared.entity.User;
import com.service.backend.shared.entity.AdminAuditLog;
import com.service.backend.user.service.NotificationService;
import com.service.backend.shared.dao.UserDisplayInfo;
import com.service.backend.user.dao.UserProfileRepository;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminUserService {
    private static final Logger logger = LoggerFactory.getLogger(AdminUserService.class);

    private final AdminUserRepository adminUserRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserProfileRepository userProfileRepository;
    private final UserOrganizationMemberRepository userOrganizationMemberRepository;
    private final NotificationService notificationService;

    public Mono<PaginatedResponse<UserResponse>> getAllUsers(int page, int size, String search, String role, String status, Integer organizationId) {
        int offset = page * size;
        String searchParam = (search != null && !search.trim().isEmpty()) ? "%" + search.trim() + "%" : null;
        String roleParam = (role != null && !role.equals("ALL")) ? role : null;
        String statusParam = (status != null && !status.equals("ALL")) ? status.toUpperCase() : null;

        return PaginationHelper.paginate(
                adminUserRepository.findUsersWithFilters(searchParam, roleParam, statusParam, organizationId, size, offset).collectList(),
                adminUserRepository.countUsersWithFilters(searchParam, roleParam, statusParam, organizationId),
                page,
                size,
                this::enrichUserResponses)
                .doOnSuccess(r -> logger.info("getAllUsers result: {}", JsonUtils.toJson(r)))
                .doOnError(error -> logger.error("Error fetching users with filters: {}", error.getMessage()));
    }

    public Mono<Boolean> banUser(Integer userId) {
        return adminUserRepository.banUserById(userId)
                .map(count -> count > 0)
                .doOnSuccess(success -> logger.info("banUser: userId={}, success={}", userId, success))
                .doOnError(error -> logger.error("Error banning user: {}", error.getMessage()));
    }

    public Mono<Boolean> deleteUser(Integer userId, boolean hardDelete) {
        if (hardDelete) {
            return adminUserRepository.hardDeleteUserById(userId)
                    .thenReturn(true)
                    .doOnSuccess(success -> logger.info("deleteUser: userId={}, hardDelete=true", userId))
                    .doOnError(error -> logger.error("Error hard deleting user: {}", error.getMessage()))
                    .onErrorReturn(false);
        } else {
            return adminUserRepository.softDeleteUserById(userId)
                    .map(count -> count > 0)
                    .doOnSuccess(success -> logger.info("deleteUser: userId={}, hardDelete=false, success={}", userId, success))
                    .doOnError(error -> logger.error("Error soft deleting user: {}", error.getMessage()));
        }
    }

    public Flux<Object> getUserVerificationRequests(Integer userId) {
        return adminUserRepository.findVerificationRequestsByUserId(userId)
                .doOnError(error -> logger.error("Error fetching verification requests for user: {}", error.getMessage()));
    }

    public Flux<Object> getPeerVerifications(Integer userId) {
        return adminUserRepository.findPeerVerificationsByUserId(userId)
                .doOnError(error -> logger.error("Error fetching peer verifications for user: {}", error.getMessage()));
    }

    @Transactional
    public Mono<Boolean> createOrganizationMember(Integer organizationId, Integer userId,
                                                  String email, String fullName, String studentId,
                                                  String role, String avatarUrl,
                                                  String password,
                                                  List<Integer> graduatedYear, List<String> graduationStatus,
                                                  List<String> program, List<String> major,
                                                  Integer verificationLevel, Boolean isTrustedVerifier,
                                                  String status) {
        String upperStatus = status == null ? "ACTIVE" : status.toUpperCase();
        boolean trustedVerifier = isTrustedVerifier != null && isTrustedVerifier;
        String graduatedYearJson = JsonUtils.toJson(graduatedYear);
        String graduationStatusJson = JsonUtils.toJson(graduationStatus);
        String programJson = JsonUtils.toJson(program);
        String majorJson = JsonUtils.toJson(major);

        Mono<Integer> userIdMono;

        if (userId != null) {
            userIdMono = adminUserRepository.findById(userId)
                    .flatMap(user -> {
                        if (StringUtils.hasText(email)) user.setEmail(email);
                        if (StringUtils.hasText(role)) {
                            try {
                                user.setRole(UserRole.valueOf(role.toUpperCase()));
                            } catch (IllegalArgumentException e) {
                                logger.warn("Invalid role provided: {}", role);
                            }
                        }
                        if (StringUtils.hasText(avatarUrl)) user.setAvatarUrl(avatarUrl);
                        
                        Mono<User> userWithPasswordMono = StringUtils.hasText(password)
                                ? Mono.fromCallable(() -> passwordEncoder.encode(password))
                                      .subscribeOn(Schedulers.boundedElastic())
                                      .doOnNext(user::setPasswordHash)
                                      .thenReturn(user)
                                : Mono.just(user);

                        return userWithPasswordMono.flatMap(u -> {
                            u.setUpdatedAt(LocalDateTime.now());
                            return adminUserRepository.save(u);
                        });
                    })
                    .map(User::getId)
                    .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND)));
        } else {
            userIdMono = adminUserRepository.existsByEmail(email)
                    .flatMap(exists -> {
                        if (exists) {
                            return Mono.error(new ApplicationException(ErrorCode.EMAIL_ALREADY_EXISTS));
                        }
                        UserRole userRole = UserRole.USER;
                        if (StringUtils.hasText(role)) {
                            try {
                                userRole = UserRole.valueOf(role.toUpperCase());
                            } catch (IllegalArgumentException e) {
                                logger.warn("Invalid role provided for new user: {}, defaulting to USER", role);
                            }
                        }
                        String finalPassword = StringUtils.hasText(password) ? password : "Alumni2026@";
                        UserRole finalUserRole = userRole;
                        return Mono.fromCallable(() -> passwordEncoder.encode(finalPassword))
                                .subscribeOn(Schedulers.boundedElastic())
                                .flatMap(encodedPassword -> {
                                    User newUser = User.builder()
                                            .email(email)
                                            .passwordHash(encodedPassword)
                                            .role(finalUserRole)
                                            .status(Status.ACTIVE)
                                            .avatarUrl(avatarUrl)
                                            .mustChangePassword(true)
                                            .createdAt(LocalDateTime.now())
                                            .updatedAt(LocalDateTime.now())
                                            .build();
                                    return adminUserRepository.save(newUser).map(User::getId);
                                });
                    });
        }

        return userIdMono.flatMap(actualUserId -> {
            Mono<Void> fullNameMono = Mono.empty();
            if (StringUtils.hasText(fullName)) {
                fullNameMono = adminUserRepository.upsertGlobalProfileFullName(actualUserId, fullName.trim()).then();
            }

            return fullNameMono.then(adminUserRepository.existsOrganizationMemberByUserId(actualUserId)
                .flatMap(exists -> exists
                    ? adminUserRepository.updateOrganizationMemberByUserId(
                        organizationId,
                        actualUserId,
                        studentId,
                        graduatedYearJson,
                        graduationStatusJson,
                        programJson,
                        majorJson,
                        verificationLevel,
                        trustedVerifier,
                        upperStatus)
                    : adminUserRepository.createOrganizationMember(
                        organizationId,
                        actualUserId,
                        studentId,
                        graduatedYearJson,
                        graduationStatusJson,
                        programJson,
                        majorJson,
                        verificationLevel,
                        trustedVerifier,
                        upperStatus))
                .map(count -> count > 0)
                .doOnSuccess(success -> logger.info("createOrganizationMember: userId={}, organizationId={}, success={}", actualUserId, organizationId, success))
                .doOnError(error -> logger.error("Error adding user {} to organization {}: {}", actualUserId, organizationId, error.getMessage()))
            );
        });
    }

    public Mono<BulkImportResult> bulkCreateOrganizationMembers(BulkCreateOrganizationMembersRequest request) {
        List<BulkCreateOrganizationMembersRequest.MemberEntry> members = request.getMembers();
        Integer organizationId = request.getOrganizationId();

        return Flux.fromIterable(members)
                .index()
                .concatMap(indexed -> {
                    int rowIndex = (int) indexed.getT1().longValue();
                    BulkCreateOrganizationMembersRequest.MemberEntry entry = indexed.getT2();

                    if (entry.getEmail() == null || entry.getEmail().isBlank()) {
                        return Mono.just(BulkImportResult.RowResult.builder()
                                .rowIndex(rowIndex)
                                .email("")
                                .fullName(entry.getFullName())
                                .studentId(entry.getStudentId())
                                .status("FAILED")
                                .reason("Email is required")
                                .build());
                    }

                    List<Integer> graduatedYearList = entry.getGraduatedYear() != null
                            ? List.of(entry.getGraduatedYear()) : null;
                    List<String> graduationStatusList = entry.getGraduationStatus() != null && !entry.getGraduationStatus().isBlank()
                            ? List.of(entry.getGraduationStatus()) : null;
                    List<String> programList = entry.getProgram() != null && !entry.getProgram().isBlank()
                            ? List.of(entry.getProgram()) : null;
                    List<String> majorList = entry.getMajor() != null && !entry.getMajor().isBlank()
                            ? List.of(entry.getMajor()) : null;

                    return createOrganizationMember(
                            organizationId, null,
                            entry.getEmail().trim(),
                            entry.getFullName(),
                            entry.getStudentId(),
                            entry.getRole(),
                            null,
                            entry.getPassword(),
                            graduatedYearList,
                            graduationStatusList,
                            programList,
                            majorList,
                            entry.getVerificationLevel() != null ? entry.getVerificationLevel() : 0,
                            entry.getIsTrustedVerifier() != null ? entry.getIsTrustedVerifier() : false,
                            entry.getStatus())
                            .map(success -> BulkImportResult.RowResult.builder()
                                    .rowIndex(rowIndex)
                                    .email(entry.getEmail())
                                    .fullName(entry.getFullName())
                                    .studentId(entry.getStudentId())
                                    .status(success ? "SUCCESS" : "FAILED")
                                    .reason(success ? null : "Failed to create or link user")
                                    .build())
                            .onErrorResume(e -> {
                                String reason = e instanceof ApplicationException ae
                                        ? ae.getErrorCode().name()
                                        : e.getMessage();
                                logger.warn("Bulk import row {} failed: {}", rowIndex, reason);
                                return Mono.just(BulkImportResult.RowResult.builder()
                                        .rowIndex(rowIndex)
                                        .email(entry.getEmail())
                                        .fullName(entry.getFullName())
                                        .studentId(entry.getStudentId())
                                        .status("FAILED")
                                        .reason(reason)
                                        .build());
                            });
                })
                .collectList()
                .map(results -> {
                    long success = results.stream().filter(r -> "SUCCESS".equals(r.getStatus())).count();
                    long failed = results.stream().filter(r -> "FAILED".equals(r.getStatus())).count();
                    return BulkImportResult.builder()
                            .total(results.size())
                            .successCount((int) success)
                            .failureCount((int) failed)
                            .results(results)
                            .build();
                })
                .doOnSuccess(r -> logger.info("bulkCreateOrganizationMembers: total={}, success={}, failed={}",
                        r.getTotal(), r.getSuccessCount(), r.getFailureCount()))
                .doOnError(e -> logger.error("Error in bulk import: {}", e.getMessage()));
    }

    public Mono<UserResponse> getUserById(Integer userId) {
        return adminUserRepository.findById(userId)
                .map(this::mapToUserResponse)
                .flatMap(this::enrichOne)
                .doOnSuccess(user -> logger.info("getUserById result: {}", JsonUtils.toJson(user)))
                .doOnError(error -> logger.error("Error fetching user: {}", error.getMessage()));
    }

    public Mono<Boolean> unbanUser(Integer userId) {
        return adminUserRepository.unbanUserById(userId)
                .map(count -> count > 0)
                .doOnSuccess(ok -> logger.info("unbanUser: userId={}, success={}", userId, ok))
                .doOnError(e -> logger.error("Error unbanning user {}", e.getMessage()));
    }

    public Mono<UserResponse> updateUser(Integer userId, UpdateUserRequest request) {
        return adminUserRepository.findById(userId)
                .flatMap(user -> {
                    if (request.getEmail() != null) user.setEmail(request.getEmail());
                    if (request.getRole() != null) user.setRole(request.getRole());
                    if (request.getStatus() != null) user.setStatus(request.getStatus());
                    user.setUpdatedAt(LocalDateTime.now());
                    return adminUserRepository.save(user);
                })
                .flatMap(saved -> applyProfileAndOrg(userId, request).then(getUserById(userId)))
                .doOnSuccess(u -> logger.info("updateUser result: {}", JsonUtils.toJson(u)))
                .doOnError(e -> logger.error("Error updating user {}", e.getMessage()));
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

    private Mono<Map<Integer, UserOrganizationMemberRepository.PrimaryOrg>> getPrimaryOrgMap(Collection<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) return Mono.just(Map.of());
        return userOrganizationMemberRepository.findPrimaryOrgByUserIds(userIds)
                .collectList()
                .map(rows -> {
                    Map<Integer, UserOrganizationMemberRepository.PrimaryOrg> map = new LinkedHashMap<>();
                    for (UserOrganizationMemberRepository.PrimaryOrg row : rows) {
                        map.putIfAbsent(row.userId(), row);
                    }
                    return map;
                });
    }

    private Mono<List<UserResponse>> enrichUserResponses(List<User> users) {
        if (users == null || users.isEmpty()) {
            return Mono.just(List.of());
        }
        List<Integer> ids = users.stream().map(User::getId).toList();
        return Mono.zip(
                        userProfileRepository.findByUserIds(ids),
                        getPrimaryOrgMap(ids))
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
                        userProfileRepository.findDisplayInfoByUserId(base.getId()).defaultIfEmpty(new UserDisplayInfo()),
                        getPrimaryOrgMap(List.of(base.getId())))
                .map(t -> mergeEnrichment(base, t.getT1(), t.getT2().get(base.getId())));
    }

    private UserResponse mergeEnrichment(
            UserResponse base,
            UserDisplayInfo di,
            UserOrganizationMemberRepository.PrimaryOrg org) {
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
    public Mono<PaginatedResponse<VerificationRequestResponse>> getAllVerificationRequests(Integer organizationId, String keyword, int page, int size) {
        int offset = page * size;
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim() + "%" : null;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                    adminUserRepository.findAllVerificationRequestsByOrganization(organizationId, kw, size, offset).collectList(),
                    adminUserRepository.countAllVerificationRequestsByOrganization(organizationId, kw),
                    page,
                    size
            )
             .doOnSuccess(r -> logger.info("getAllVerificationRequests (org={}) result: {}", organizationId, JsonUtils.toJson(r)))
             .doOnError(e -> logger.error("Error fetching verification requests for org {}", e.getMessage()));
        }
        return PaginationHelper.paginate(
                adminUserRepository.findAllVerificationRequests(kw, size, offset).collectList(),
                adminUserRepository.countAllVerificationRequests(kw),
                page,
                size
        )
         .doOnSuccess(r -> logger.info("getAllVerificationRequests result: {}", JsonUtils.toJson(r)))
         .doOnError(e -> logger.error("Error fetching verification requests: {}", e.getMessage()));
    }

    public Mono<PaginatedResponse<VerificationRequestResponse>> getPendingVerificationRequests(Integer organizationId, String keyword, int page, int size) {
        int offset = page * size;
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim() + "%" : null;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                    adminUserRepository.findPendingVerificationRequestsByOrganization(organizationId, kw, size, offset).collectList(),
                    adminUserRepository.countPendingVerificationRequestsByOrganization(organizationId, kw),
                    page,
                    size
            )
             .doOnSuccess(r -> logger.info("getPendingVerificationRequests (org={}) result: {}", organizationId, JsonUtils.toJson(r)))
             .doOnError(e -> logger.error("Error fetching pending verification requests for org {}", e.getMessage()));
        }
        return PaginationHelper.paginate(
                adminUserRepository.findPendingVerificationRequests(kw, size, offset).collectList(),
                adminUserRepository.countPendingVerificationRequests(kw),
                page,
                size
        )
         .doOnSuccess(r -> logger.info("getPendingVerificationRequests result: {}", JsonUtils.toJson(r)))
         .doOnError(e -> logger.error("Error fetching pending verification requests: {}", e.getMessage()));
    }

    public Mono<Boolean> reviewVerificationRequest(Integer requestId, String status, String adminNote) {
        String upperStatus = status == null ? null : status.toUpperCase();
        return Mono.zip(
                        adminUserRepository.findMemberIdByRequestId(requestId),
                        adminUserRepository.findOrganizationIdByRequestId(requestId))
                .flatMap(tuple -> {
                    Integer memberId = tuple.getT1();
                    Integer organizationId = tuple.getT2();
                    return adminUserRepository.reviewVerificationRequest(requestId, Status.valueOf(upperStatus).getValue(), adminNote)
                        .flatMap(count -> {
                            if (count <= 0) return Mono.just(false);

                            if ("APPROVED".equals(upperStatus)) {
                                Mono.fromRunnable(() -> notificationService.createNotificationAsync(memberId, "Xác thực thành công", "Yêu cầu xác thực của bạn đã được duyệt."))
                                        .subscribeOn(Schedulers.boundedElastic())
                                        .subscribe();
                                return userOrganizationMemberRepository.incrementVerificationLevelByOrgAndUser(organizationId, memberId)
                                        .thenReturn(true);
                            } else if ("REJECTED".equals(upperStatus)) {
                                String msg = "Yêu cầu xác thực của bạn đã bị từ chối.";
                                if (StringUtils.hasText(adminNote)) {
                                    msg += " Lý do: " + adminNote;
                                }
                                String finalMsg = msg;
                                Mono.fromRunnable(() -> notificationService.createNotificationAsync(memberId, "Xác thực thất bại", finalMsg))
                                        .subscribeOn(Schedulers.boundedElastic())
                                        .subscribe();
                            }
                            return Mono.just(true);
                        });
                })
                .doOnSuccess(ok -> logger.info("reviewVerificationRequest: requestId={}, status={}, success={}", requestId, upperStatus, ok))
                .doOnError(e -> logger.error("Error reviewing verification request {}", e.getMessage()))
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
        return getAdminActionLogs(null, adminUserId, targetUserId, action, page, size);
    }

    public Mono<PaginatedResponse<AdminAuditLog>> getAdminActionLogs(
            Integer organizationId,
            Integer adminUserId,
            Integer targetUserId,
            String action,
            int page,
            int size) {
        int offset = page * size;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                    adminAuditLogRepository.findAdminActionLogsByOrganization(organizationId, adminUserId, targetUserId, action, size, offset).collectList(),
                    adminAuditLogRepository.countAdminActionLogsByOrganization(organizationId, adminUserId, targetUserId, action),
                    page,
                    size)
                    .doOnSuccess(r -> logger.info("getAdminActionLogs (org={}) result: {}", organizationId, JsonUtils.toJson(r)))
                    .doOnError(e -> logger.error("Error fetching admin action logs for org {}", e.getMessage()));
        }
        return PaginationHelper.paginate(
                adminAuditLogRepository.findAdminActionLogs(adminUserId, targetUserId, action, size, offset).collectList(),
                adminAuditLogRepository.countAdminActionLogs(adminUserId, targetUserId, action),
                page,
                size)
                .doOnSuccess(r -> logger.info("getAdminActionLogs result: {}", JsonUtils.toJson(r)))
                .doOnError(e -> logger.error("Error fetching admin action logs: {}", e.getMessage()));
    }

    @Transactional
    public Mono<Boolean> resetPasswordByAdmin(Integer userId, AdminResetPasswordRequest request, Integer adminUserId) {
        return Mono.fromCallable(() -> passwordEncoder.encode(request.getNewPassword()))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(encodedPassword -> adminUserRepository.resetPasswordByAdmin(userId, encodedPassword)
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
                }));
    }

    @Transactional
    public Mono<Boolean> createAdminAccount(CreateAdminRequest request) {
        return adminUserRepository.existsByEmail(request.getEmail())
                .flatMap(exists -> {
                    if (exists) {
                        return Mono.error(new ApplicationException(ErrorCode.EMAIL_ALREADY_EXISTS));
                    }
                    return Mono.fromCallable(() -> passwordEncoder.encode(request.getPassword()))
                            .subscribeOn(Schedulers.boundedElastic())
                            .flatMap(encodedPassword -> adminUserRepository.createAdminUser(
                                    request.getEmail(),
                                    encodedPassword)
                            .flatMap(adminUserId -> adminUserRepository
                                    .createGlobalProfile(adminUserId, request.getFullName())
                                    .then(adminUserRepository.upsertOrganizationMemberByUserId(
                                            request.getOrganizationId(),
                                            adminUserId))
                                    .thenReturn(true)));
                })
                .doOnSuccess(created -> logger.info("createAdminAccount: email={}, success={}", request.getEmail(), created))
                .doOnError(e -> logger.error("Error creating admin account for email={}: {}", request.getEmail(), e.getMessage()));
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
                .doOnError(error -> logger.error("Error updating is_trusted_verifier for user {} and organization {}: {}", userId, organizationId, error.getMessage()));
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
                .doOnError(e -> logger.error("Error fetching user growth statistics: {}", e.getMessage()));
    }

    public Mono<VerificationStatisticsDTO> getVerificationStatistics() {
        return Mono.zip(
                adminUserRepository.countAllVerificationRequests(null),
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
                .doOnError(e -> logger.error("Error fetching verification statistics: {}", e.getMessage()));
    }

    /**
     * Map User entity to UserResponse DTO
     */
    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .status(user.getStatus())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
