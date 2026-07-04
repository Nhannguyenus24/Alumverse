package com.service.backend.user.service;

import com.service.backend.user.dto.*;
import org.springframework.transaction.annotation.Transactional;
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
import com.service.backend.shared.service.FileUploadService;
import com.service.backend.shared.service.OCRService;
import com.service.backend.shared.entity.UserNotificationSettings;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

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
    private final OCRService ocrService;

    @Transactional
    public Mono<Void> createVerificationRequest(Long currentUserId, CreateVerificationRequest request) {
        return fileUploadService.uploadBase64File(request.getBase64File(), request.getOriginalFileName())
                .flatMap(fileUrl -> authRepository.insertVerificationRequest(
                        currentUserId.intValue(),
                        fileUrl,
                        request.getDocumentType() != null ? request.getDocumentType().getValue() : null
                ).publishOn(Schedulers.boundedElastic()).doOnSuccess(requestId -> {
                    if (requestId != null) {
                        String localPath = fileUploadService.getLocalPath(fileUrl);
                        if (localPath != null) {
                            ocrService.extractTextFromFile(localPath)
                                    .flatMap(text -> authRepository.updateAiSummary(requestId, text))
                                    .doOnError(e -> logger.error("Background OCR failed for requestId {}: {}", requestId, e.getMessage()))
                                    .subscribe();
                        }
                    }
                })).flatMap(v -> userOrganizationMemberRepository.updateVerificationLevel(currentUserId.intValue(), 1))
                .then();
    }

    @Transactional
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
                                return Mono.when(
                                        peerVerificationRepository.save(PeerVerification.builder()
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
                                                                String.format("Người dùng %s đã gửi yêu cầu xác thực đồng nghiệp cho bạn.", targetMember.getUserId()),
                                                                "/profile/" + targetMember.getUserId()
                                                        );
                                                    }
                                                }),
                                        userOrganizationMemberRepository.updateVerificationLevel(targetMember.getUserId(), 1)
                                );
                            });
                })
                .then();
    }

    @Transactional
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

                                return Mono.when(
                                        peerVerificationRepository.updateStatus(requestId, Status.APPROVED),
                                        userOrganizationMemberRepository.incrementVerificationLevelByUserId(request.getTargetMemberId())
                                );
                            });
                })
                .then();
    }

    @Transactional
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

                    return Mono.when(
                            peerVerificationRepository.save(PeerVerification.builder()
                                    .targetMemberId(targetMember.getUserId())
                                    .verifierMemberId(verifierMember.getUserId())
                                    .status(Status.ACCEPTED)
                                    .build()),
                            Mono.defer(() -> {
                                targetMember.setVerificationLevel(targetMember.getVerificationLevel() + 1);
                                return userOrganizationMemberRepository.save(targetMember);
                            })
                    );
                })
                .then();
    }

    public Mono<List<PendingPeerVerificationResponse>> getPendingPeerVerifications(Long currentUserId, Integer organizationId) {
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

                    return Mono.fromCallable(() -> passwordEncoder.encode(newPassword))
                            .subscribeOn(Schedulers.boundedElastic())
                            .flatMap(hashedPassword -> authRepository.updatePasswordById(userId, hashedPassword));
                })
                .doOnSuccess(v -> logger.info("changeMyPassword: userId={} password changed", userId));
    }

    public Mono<UserProfileResponse> getPublicProfile(Integer userId) {
        return userProfileRepository.findProfileByUserId(userId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(
                        ErrorCode.USER_NOT_FOUND,
                        "User not found with id: " + userId))))
                .doOnSuccess(r -> logger.info("getPublicProfile result: {}", JsonUtils.toJson(r)));
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

    @Transactional
    public Mono<Void> updateMyProfile(Long currentUserId, UpdateMyProfileRequest request) {
        Integer userId = currentUserId.intValue();

        Mono<Integer> updateGlobalProfile = userProfileRepository
                .upsertProfileInfo(
                        userId,
                        request.getPhone(),
                        request.getGender(),
                        request.getBio(),
                        request.getCoverUrl());

        Mono<Integer> updateOrganizationMember = userOrganizationMemberRepository
                .updateAcademicProfileByOrganizationAndUserId(
                        request.getOrganizationId(),
                        userId,
                JsonUtils.toJson(request.getProgram()),
                JsonUtils.toJson(request.getStartedYear()),
                JsonUtils.toJson(request.getGraduatedYear()),
                JsonUtils.toJson(request.getGraduationStatus()),
                JsonUtils.toJson(request.getMajor()),
                JsonUtils.toJson(request.getFaculty()),
                JsonUtils.toJson(request.getDepartment()))
                .flatMap(updatedRows -> {
                    if (updatedRows == null || updatedRows <= 0) {
                        return Mono.error(new ApplicationException(ErrorCode.ORGANIZATION_MEMBER_NOT_FOUND));
                    }
                    return Mono.just(updatedRows);
                });

        return Mono.when(updateGlobalProfile, updateOrganizationMember)
                .doOnSuccess(v -> logger.info("updateMyProfile: userId={} updated", userId));
    }

    /**
     * Update the current user's avatar. The caller uploads the image via
     * {@code POST /api/images/upload} and passes the returned URL here.
     */
    public Mono<Void> updateMyAvatar(Long currentUserId, String avatarUrl) {
        if (avatarUrl == null || avatarUrl.isBlank()) {
            return Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST, "Avatar URL is required"));
        }
        return authRepository.updateAvatarById(currentUserId.intValue(), avatarUrl.trim())
                .doOnSuccess(v -> logger.info("updateMyAvatar: userId={} updated", currentUserId));
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
                .startedYear(parseStringList(member.getStartedYear()))
                .graduatedYear(parseIntegerList(member.getGraduatedYear()))
                .graduationStatus(parseStringList(member.getGraduationStatus() != null ? member.getGraduationStatus() : null))
                .program(parseStringList(member.getProgram()))
                .major(parseStringList(member.getMajor()))
                .faculty(parseStringList(member.getFaculty()))
                .department(parseStringList(member.getDepartment()))
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
