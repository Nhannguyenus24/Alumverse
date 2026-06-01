package com.service.backend.user.service;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.service.backend.auth.dao.AuthRepository;
import com.service.backend.shared.entity.OrganizationMember;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.user.dao.UserLoginHistoryRepository;
import com.service.backend.user.dao.UserNotificationSettingsRepository;
import com.service.backend.user.dao.UserOrganizationMemberRepository;
import com.service.backend.user.dao.UserProfileRepository;
import com.service.backend.user.dao.PeerVerificationRepository;
import com.service.backend.shared.entity.PeerVerification;
import com.service.backend.user.dto.CreateVerificationRequest;
import com.service.backend.shared.service.FileUploadService;
import com.service.backend.user.dto.NotificationSettingsResponse;
import com.service.backend.user.dto.UpdateMyProfileRequest;
import com.service.backend.user.dto.UpdateNotificationSettingsRequest;
import com.service.backend.user.dto.UserLoginHistoryResponse;
import com.service.backend.user.dto.UserOrganizationMemberResponse;
import com.service.backend.user.dto.UserProfileResponse;
import com.service.backend.shared.entity.UserNotificationSettings;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserProfileRepository userProfileRepository;
    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserLoginHistoryRepository userLoginHistoryRepository;
    private final UserNotificationSettingsRepository userNotificationSettingsRepository;
    private final UserOrganizationMemberRepository userOrganizationMemberRepository;
    private final PeerVerificationRepository peerVerificationRepository;
    private final FileUploadService fileUploadService;
    private final NotificationService notificationService;

    public Mono<Void> createVerificationRequest(Long currentUserId, CreateVerificationRequest request) {
        return fileUploadService.uploadBase64File(request.getBase64File(), request.getOriginalFileName())
                .flatMap(fileUrl -> {
                    // member_id in verification_requests corresponds to user_id in users table according to AdminUserRepository.findAllVerificationRequests join
                    // where "JOIN users u ON vr.member_id = u.id"
                        return authRepository.insertVerificationRequest(
                            currentUserId.intValue(),
                            fileUrl,
                            request.getDocumentType() != null ? request.getDocumentType().getValue() : null
                        ).then();
                });
    }

    public Mono<Void> requestPeerVerification(Long currentUserId, Integer organizationId, Integer verifierUserId) {
        return Mono.zip(
                userOrganizationMemberRepository.findByOrganizationIdAndUserId(organizationId, currentUserId.intValue()),
                userOrganizationMemberRepository.findByOrganizationIdAndUserId(organizationId, verifierUserId))
                .flatMap(tuple -> {
                    OrganizationMember targetMember = tuple.getT1();
                    OrganizationMember verifierMember = tuple.getT2();

                    return peerVerificationRepository.findPendingRequest(targetMember.getUserId(), verifierMember.getUserId())
                            .hasElement()
                            .flatMap(exists -> {
                                if (exists) {
                                    return Mono.error(new ApplicationException(ErrorCode.RESOURCES_DUPLICATE, "Pending verification request already exists"));
                                }
                                return peerVerificationRepository.save(PeerVerification.builder()
                                        .targetMemberId(targetMember.getUserId())
                                        .verifierMemberId(verifierMember.getUserId())
                                        .status(Status.PENDING)
                                        .createdAt(LocalDateTime.now())
                                        .build())
                                        .doOnSuccess(saved -> {
                                            if (Boolean.TRUE.equals(verifierMember.getIsTrustedVerifier())) {
                                                notificationService.createNotificationAsync(
                                                        verifierUserId,
                                                        "Yêu cầu xác thực đồng nghiệp",
                                                        String.format("Người dùng %s đã gửi yêu cầu xác thực đồng nghiệp cho bạn.", targetMember.getUserId())
                                                );
                                            }
                                        });
                            });
                })
                .then();
    }

    public Mono<Void> acceptPeerVerification(Long currentUserId, Integer requestId) {
        return peerVerificationRepository.findById(requestId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Verification request not found")))
                .flatMap(request -> {
                    if (Status.PENDING != request.getStatus()) {
                        return Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST, "Request is not in pending status"));
                    }

                    return userOrganizationMemberRepository.findByUserId(request.getVerifierMemberId())
                            .flatMap(verifier -> {
                                if (!verifier.getUserId().equals(currentUserId.intValue())) {
                                    return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "You are not the assigned verifier for this request"));
                                }
                                if (Boolean.FALSE.equals(verifier.getIsTrustedVerifier())) {
                                    return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Only trusted verifiers can accept verification requests"));
                                }

                                return peerVerificationRepository.updateStatus(requestId, Status.APPROVED)
                                        .then(userOrganizationMemberRepository.incrementVerificationLevelByUserId(request.getTargetMemberId()));
                            });
                })
                .then();
    }

    public Mono<Void> directVerify(Long currentUserId, Integer organizationId, Integer targetUserId) {
        return Mono.zip(
                userOrganizationMemberRepository.findByOrganizationIdAndUserId(organizationId, currentUserId.intValue()),
                userOrganizationMemberRepository.findByOrganizationIdAndUserId(organizationId, targetUserId))
                .flatMap(tuple -> {
                    OrganizationMember verifierMember = tuple.getT1();
                    OrganizationMember targetMember = tuple.getT2();

                    if (Boolean.FALSE.equals(verifierMember.getIsTrustedVerifier())) {
                        return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Only trusted verifiers can perform direct verification"));
                    }

                    return peerVerificationRepository.save(PeerVerification.builder()
                                    .targetMemberId(targetMember.getUserId())
                                    .verifierMemberId(verifierMember.getUserId())
                                    .status(Status.ACCEPTED)
                                    .build())
                            .then(Mono.defer(() -> {
                                targetMember.setVerificationLevel(targetMember.getVerificationLevel() + 1);
                                return userOrganizationMemberRepository.save(targetMember);
                            }));
                })
                .then();
    }

    public Mono<List<com.service.backend.user.dto.PendingPeerVerificationResponse>> getPendingPeerVerifications(Long currentUserId, Integer organizationId) {
        return userOrganizationMemberRepository.findByOrganizationIdAndUserId(organizationId, currentUserId.intValue())
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ORGANIZATION_MEMBER_NOT_FOUND)))
                .flatMap(member -> {
                    if (Boolean.FALSE.equals(member.getIsTrustedVerifier())) {
                        return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Only trusted verifiers can view pending verification requests"));
                    }
                    return peerVerificationRepository.findPendingRequestsByVerifierMemberId(member.getUserId()).collectList();
                });
    }

    public Mono<UserProfileResponse> getMyProfile(Long currentUserId) {
        return userProfileRepository.findProfileByUserId(currentUserId.intValue())
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(
                        ErrorCode.USER_NOT_FOUND,
                        "User not found with id: " + currentUserId))))
                .doOnSuccess(r -> logger.info("getMyProfile result: {}", JsonUtils.toJson(r)));
    }

    public Mono<Void> changeMyPassword(Long currentUserId, String oldPassword, String newPassword) {
        Integer userId = currentUserId.intValue();

        return authRepository.findById(userId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(
                        ErrorCode.USER_NOT_FOUND,
                        "User not found with id: " + userId))))
                .flatMap(user -> {
                    if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
                        return Mono.error(new ApplicationException(ErrorCode.INVALID_OLD_PASSWORD));
                    }

                    String hashedPassword = passwordEncoder.encode(newPassword);
                    return authRepository.updatePasswordById(userId, hashedPassword);
                })
                .doOnSuccess(v -> logger.info("changeMyPassword: userId={} password changed", userId));
    }

    public Mono<List<UserLoginHistoryResponse>> getMyLoginHistory(Long currentUserId, int page, int limit) {
        int offset = page * limit;
        return userLoginHistoryRepository.findByUserIdOrderByLoginAtDesc(currentUserId.intValue(), limit, offset)
                .map(history -> UserLoginHistoryResponse.builder()
                        .id(history.getId())
                        .loginAt(history.getLoginAt())
                        .loginMethod(history.getLoginMethod())
                        .loginIp(history.getLoginIp())
                        .userAgent(history.getUserAgent())
                        .build())
                .collectList()
                .doOnSuccess(r -> logger.info("getMyLoginHistory result: {}", JsonUtils.toJson(r)));
    }

    public Mono<NotificationSettingsResponse> getMyNotificationSettings(Long currentUserId) {
        return userNotificationSettingsRepository.findById(currentUserId.intValue())
                .map(this::toNotificationResponse)
                .defaultIfEmpty(defaultNotificationSettings(currentUserId.intValue()))
                .doOnSuccess(r -> logger.info("getMyNotificationSettings result: {}", JsonUtils.toJson(r)));
    }

    public Mono<NotificationSettingsResponse> updateMyNotificationSettings(
            Long currentUserId,
            UpdateNotificationSettingsRequest request) {

        Integer userId = currentUserId.intValue();
        return userNotificationSettingsRepository.findById(userId)
                .defaultIfEmpty(UserNotificationSettings.builder()
                        .userId(userId)
                        .emailEnabled(true)
                        .pushEnabled(true)
                        .eventReminderEnabled(true)
                        .newsEnabled(true)
                        .forumReplyEnabled(true)
                        .build())
                .flatMap(existing -> {
                    if (request.getEmailEnabled() != null) {
                        existing.setEmailEnabled(request.getEmailEnabled());
                    }
                    if (request.getPushEnabled() != null) {
                        existing.setPushEnabled(request.getPushEnabled());
                    }
                    if (request.getEventReminderEnabled() != null) {
                        existing.setEventReminderEnabled(request.getEventReminderEnabled());
                    }
                    if (request.getNewsEnabled() != null) {
                        existing.setNewsEnabled(request.getNewsEnabled());
                    }
                    if (request.getForumReplyEnabled() != null) {
                        existing.setForumReplyEnabled(request.getForumReplyEnabled());
                    }

                    return userNotificationSettingsRepository.save(existing);
                })
                .map(this::toNotificationResponse)
                .doOnSuccess(r -> logger.info("updateMyNotificationSettings result: {}", JsonUtils.toJson(r)));
    }

    public Mono<Void> updateMyProfile(Long currentUserId, UpdateMyProfileRequest request) {
        Integer userId = currentUserId.intValue();

        Mono<Integer> updateGlobalProfile = userProfileRepository
                .upsertPhoneAndGender(userId, request.getPhone(), request.getGender());

        Mono<Integer> updateOrganizationMember = userOrganizationMemberRepository
                .updateAcademicProfileByOrganizationAndUserId(
                        request.getOrganizationId(),
                        userId,
                JsonUtils.toJson(request.getProgram()),
                JsonUtils.toJson(request.getGraduatedYear()),
                JsonUtils.toJson(request.getGraduationStatus()),
                JsonUtils.toJson(request.getMajor()))
                .flatMap(updatedRows -> {
                    if (updatedRows == null || updatedRows <= 0) {
                        return Mono.error(new ApplicationException(ErrorCode.ORGANIZATION_MEMBER_NOT_FOUND));
                    }
                    return Mono.just(updatedRows);
                });

        return updateGlobalProfile.then(updateOrganizationMember).then()
                .doOnSuccess(v -> logger.info("updateMyProfile: userId={} updated", userId));
    }

    public Mono<UserOrganizationMemberResponse> getMyOrganizationMember(Long currentUserId, Integer organizationId) {
        return userOrganizationMemberRepository
                .findByOrganizationIdAndUserId(organizationId, currentUserId.intValue())
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.ORGANIZATION_MEMBER_NOT_FOUND))))
                .map(this::toOrganizationMemberResponse)
                .doOnSuccess(r -> logger.info("getMyOrganizationMember result: {}", JsonUtils.toJson(r)));
    }

    private NotificationSettingsResponse toNotificationResponse(UserNotificationSettings settings) {
        return NotificationSettingsResponse.builder()
                .userId(settings.getUserId())
                .emailEnabled(settings.getEmailEnabled())
                .pushEnabled(settings.getPushEnabled())
                .eventReminderEnabled(settings.getEventReminderEnabled())
                .newsEnabled(settings.getNewsEnabled())
                .forumReplyEnabled(settings.getForumReplyEnabled())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }

    private NotificationSettingsResponse defaultNotificationSettings(Integer userId) {
        return NotificationSettingsResponse.builder()
                .userId(userId)
                .emailEnabled(true)
                .pushEnabled(true)
                .eventReminderEnabled(true)
                .newsEnabled(true)
                .forumReplyEnabled(true)
                .updatedAt(null)
                .build();
    }

    private UserOrganizationMemberResponse toOrganizationMemberResponse(OrganizationMember member) {
        return UserOrganizationMemberResponse.builder()
                .id(member.getId())
                .organizationId(member.getOrganizationId())
                .userId(member.getUserId())
                .graduatedYear(parseIntegerList(member.getGraduatedYear()))
                .graduationStatus(parseStringList(member.getGraduationStatus() != null ? member.getGraduationStatus().getValue() : null))
                .program(parseStringList(member.getProgram()))
                .major(parseStringList(member.getMajor()))
                .verificationLevel(member.getVerificationLevel())
                .isTrustedVerifier(member.getIsTrustedVerifier())
                .status(member.getStatus() != null ? member.getStatus().getValue() : null)
                .createdAt(member.getCreatedAt())
                .updatedAt(member.getUpdatedAt())
                .build();
    }

    private List<String> parseStringList(String jsonValue) {
        if (jsonValue == null || jsonValue.trim().isEmpty()) {
            return List.of();
        }
        if (JsonUtils.isJsonArray(jsonValue)) {
            List<String> values = JsonUtils.fromJsonToList(jsonValue, String.class);
            return values == null ? List.of() : values;
        }
        return List.of(jsonValue);
    }

    private List<Integer> parseIntegerList(String jsonValue) {
        if (jsonValue == null || jsonValue.trim().isEmpty()) {
            return List.of();
        }
        if (JsonUtils.isJsonArray(jsonValue)) {
            List<Integer> values = JsonUtils.fromJsonToList(jsonValue, Integer.class);
            return values == null ? List.of() : values;
        }
        try {
            return List.of(Integer.valueOf(jsonValue.trim()));
        } catch (NumberFormatException ex) {
            return List.of();
        }
    }
}
