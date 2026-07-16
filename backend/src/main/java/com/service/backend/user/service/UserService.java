package com.service.backend.user.service;

import com.service.backend.user.dto.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.service.backend.auth.dao.AuthRepository;
import com.service.backend.organization.dao.OrganizationRepository;
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
import com.service.backend.chat.service.ChatConversationRequestService;
import com.service.backend.shared.service.FileUploadService;
import com.service.backend.shared.service.ImageService;
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
    private final OrganizationRepository organizationRepository;
    private final PeerVerificationRepository peerVerificationRepository;
    private final ChatConversationRequestService chatConversationRequestService;
    private final FileUploadService fileUploadService;
    private final ImageService imageService;
    private final NotificationService notificationService;
    private final com.service.backend.user.dao.DeviceTokenRepository deviceTokenRepository;
    private final OCRService ocrService;
    private final com.service.backend.shared.service.EmailService emailService;


    public Mono<Void> registerDeviceToken(Long currentUserId, String fcmToken, String platform) {
        return deviceTokenRepository.upsertToken(currentUserId.intValue(), fcmToken, platform).then();
    }

    public Mono<Void> unregisterDeviceToken(String fcmToken) {
        return deviceTokenRepository.deleteByToken(fcmToken).then();
    }

    @Transactional
    public Mono<Void> createVerificationRequest(Long currentUserId, CreateVerificationRequest request) {
        return fileUploadService.uploadBase64File(request.getBase64File(), request.getOriginalFileName())
                .flatMap(fileUrl -> authRepository.insertVerificationRequest(
                        request.getOrganizationId(),
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
                })).flatMap(v -> userOrganizationMemberRepository.updateVerificationLevelByOrgAndUser(request.getOrganizationId(), currentUserId.intValue(), 1))
                .then();
    }

    @Transactional
    public Mono<Void> requestPeerVerification(Long currentUserId, Integer organizationId, Integer verifierUserId) {
        return Mono.zip(
                userOrganizationMemberRepository.findByOrganizationIdAndUserId(organizationId, currentUserId.intValue())
                        .switchIfEmpty(Mono.error(new ApplicationException(
                                ErrorCode.ORGANIZATION_MEMBER_NOT_FOUND,
                                "Requester is not a member of this organization"))),
                userOrganizationMemberRepository.findByOrganizationIdAndUserId(organizationId, verifierUserId)
                        .switchIfEmpty(Mono.error(new ApplicationException(
                                ErrorCode.ORGANIZATION_MEMBER_NOT_FOUND,
                                "Verifier is not a member of this organization"))))
                .flatMap(tuple -> {
                    OrganizationMember targetMember = tuple.getT1();
                    OrganizationMember verifierMember = tuple.getT2();

                    return peerVerificationRepository.findPendingRequest(organizationId, targetMember.getUserId(), verifierMember.getUserId())
                            .hasElement()
                            .flatMap(exists -> {
                                if (exists) {
                                    return Mono.error(new ApplicationException(ErrorCode.RESOURCES_DUPLICATE, "Pending verification request already exists"));
                                }
                                Mono<PeerVerification> saveRequest = peerVerificationRepository.save(PeerVerification.builder()
                                        .organizationId(organizationId)
                                        .targetMemberId(targetMember.getUserId())
                                        .verifierMemberId(verifierMember.getUserId())
                                        .status(Status.PENDING)
                                        .createdAt(LocalDateTime.now())
                                        .build())
                                        .flatMap(saved -> {
                                            if (!Boolean.TRUE.equals(verifierMember.getIsTrustedVerifier())) {
                                                return Mono.just(saved);
                                            }
                                            return userProfileRepository.findDisplayInfoByUserId(targetMember.getUserId())
                                                    .map(info -> StringUtils.hasText(info.getFullName())
                                                            ? info.getFullName().trim()
                                                            : "Người dùng " + targetMember.getUserId())
                                                    .defaultIfEmpty("Người dùng " + targetMember.getUserId())
                                                    .flatMap(requesterName -> {
                                                        String notice = String.format(
                                                                "%s đã gửi yêu cầu xác thực đồng nghiệp cho bạn.", requesterName);
                                                        notificationService.createNotificationAsync(
                                                                verifierUserId,
                                                                "Yêu cầu xác thực đồng nghiệp",
                                                                notice,
                                                                "/settings?tab=verification"
                                                        );
                                                        // Grants messaging access immediately so the requester can
                                                        // reach out to the verifier while the request is pending —
                                                        // see docs discussion on peer verification chat access.
                                                        return chatConversationRequestService.autoAcceptConversationRequest(
                                                                        targetMember.getUserId().longValue(),
                                                                        verifierMember.getUserId().longValue(),
                                                                        notice)
                                                                .thenReturn(saved);
                                                    });
                                        });

                                return Mono.when(
                                        saveRequest,
                                        userOrganizationMemberRepository.updateVerificationLevelByOrgAndUser(organizationId, targetMember.getUserId(), 1)
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

                    return userOrganizationMemberRepository.findByOrganizationIdAndUserId(request.getOrganizationId(), request.getVerifierMemberId())
                            .flatMap(verifier -> {
                                if (!verifier.getUserId().equals(currentUserId.intValue())) {
                                    return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "You are not the assigned verifier for this request"));
                                }
                                if (Boolean.FALSE.equals(verifier.getIsTrustedVerifier())) {
                                    return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Only trusted verifiers can accept verification requests"));
                                }

                                return Mono.when(
                                        peerVerificationRepository.updateStatus(requestId, Status.APPROVED),
                                        peerVerificationRepository.resolveOtherPendingRequestsForTarget(
                                                request.getOrganizationId(),
                                                request.getTargetMemberId(),
                                                requestId,
                                                Status.CANCELLED),
                                        userOrganizationMemberRepository.incrementVerificationLevelByOrgAndUser(request.getOrganizationId(), request.getTargetMemberId())
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
                                    .organizationId(organizationId)
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

    public Mono<List<Integer>> getPeerVerificationCounterparts(Long currentUserId, Integer organizationId) {
        return peerVerificationRepository.findCounterpartMemberIds(organizationId, currentUserId.intValue())
                .collectList();
    }

    public Mono<List<PendingPeerVerificationResponse>> getPendingPeerVerifications(Long currentUserId, Integer organizationId) {
        return userOrganizationMemberRepository.findByOrganizationIdAndUserId(organizationId, currentUserId.intValue())
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ORGANIZATION_MEMBER_NOT_FOUND)))
                .flatMap(member -> {
                    if (Boolean.FALSE.equals(member.getIsTrustedVerifier())) {
                        return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Only trusted verifiers can view pending verification requests"));
                    }
                    return peerVerificationRepository.findPendingRequestsByVerifierMemberId(organizationId, member.getUserId()).collectList();
                });
    }

    public Mono<UserProfileResponse> getMyProfile(Long currentUserId, Integer organizationId) {
        return userProfileRepository.findProfileByUserId(currentUserId.intValue(), organizationId)
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
                            .flatMap(hashedPassword -> authRepository.updatePasswordById(userId, hashedPassword))
                            .then(Mono.defer(() -> emailService.sendHtmlEmail(
                                user.getEmail(),
                                "Thông báo thay đổi mật khẩu thành công",
                                "passwordChangedSuccessfully",
                                Map.of("email", user.getEmail())
                            ).onErrorResume(err -> {
                                logger.error("Failed to send password changed email to {}: {}", user.getEmail(), err.getMessage());
                                return Mono.empty();
                            }).then()));
                })
                .doOnSuccess(v -> logger.info("changeMyPassword: userId={} password changed", userId));
    }

    public Mono<UserProfileResponse> getPublicProfile(Integer userId, Integer organizationId) {
        return userProfileRepository.findProfileByUserId(userId, organizationId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(
                        ErrorCode.USER_NOT_FOUND,
                        "User not found with id: " + userId))))
                .doOnSuccess(r -> logger.info("getPublicProfile result: {}", JsonUtils.toJson(r)));
    }

    @Transactional
    public Mono<Void> joinOrganization(Long currentUserId, JoinOrganizationRequest request) {
        Integer userId = currentUserId.intValue();
        String studentId = StringUtils.hasText(request.getStudentId())
                ? request.getStudentId().trim()
                : null;

        return organizationRepository.findById(request.getOrganizationId())
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.ORGANIZATION_NOT_FOUND,
                        "Organization not found")))
                .map(organization -> StringUtils.hasText(organization.getName())
                        ? JsonUtils.toJson(List.of(organization.getName().trim()))
                        : JsonUtils.toJson(List.of()))
                .flatMap(defaultFaculty -> userOrganizationMemberRepository.upsertSelfRegistration(
                        request.getOrganizationId(),
                        userId,
                        studentId,
                        defaultFaculty,
                        JsonUtils.toJson(request.getStartedYear()),
                        JsonUtils.toJson(request.getGraduatedYear()),
                        JsonUtils.toJson(request.getGraduationStatus()),
                        JsonUtils.toJson(request.getProgram()),
                        JsonUtils.toJson(request.getMajor()))
                .flatMap(updatedRows -> {
                    if (updatedRows == null || updatedRows <= 0) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.RESOURCES_NOT_FOUND,
                                "Failed to register organization membership"));
                    }
                    return Mono.just(updatedRows);
                })
                .onErrorMap(DataIntegrityViolationException.class, error -> {
                    String message = error.getMessage() != null ? error.getMessage().toLowerCase() : "";
                    if (message.contains("student_id")) {
                        return new ApplicationException(ErrorCode.STUDENT_ID_ALREADY_EXISTS, error);
                    }
                    return error;
                })
                .doOnSuccess(v -> logger.info(
                        "joinOrganization: userId={} organizationId={} updated",
                        userId,
                        request.getOrganizationId()))
                .then());
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
                .upsertProfileInfo(userId, request.getFullName(), request.getPhone(), request.getGender(),
                        request.getDob(), request.getBio(),
                        request.getCurrentJobTitle(), request.getCurrentCompany(),
                        request.getLinks() != null ? JsonUtils.toJson(request.getLinks()) : null);

        Mono<Integer> updateOrganizationMember = userOrganizationMemberRepository
                .updateAcademicProfileByOrganizationAndUserId(
                        request.getOrganizationId(),
                        userId,
                request.getStudentId(),
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
     * Update the current user's avatar. Accepts the raw image as base64 (converted to WebP and
     * stored server-side) or, as a fallback, an already-uploaded image URL. Returns the final
     * stored image URL so the caller can refresh its UI without an extra round-trip.
     */
    public Mono<String> updateMyAvatar(Long currentUserId, UpdateAvatarRequest request) {
        return imageService.uploadBase64IfPresent(request.getAvatarBase64())
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.BAD_REQUEST, "Avatar image is required")))
                .flatMap(avatarUrl -> {
                    String finalUrl = avatarUrl.trim();
                    return authRepository.updateAvatarById(currentUserId.intValue(), finalUrl)
                            .thenReturn(finalUrl);
                })
                .doOnSuccess(v -> logger.info("updateMyAvatar: userId={} updated", currentUserId));
    }

    /**
     * Update the current user's cover. Accepts the raw image as base64 (converted to WebP and
     * stored server-side) or, as a fallback, an already-uploaded image URL. Returns the final
     * stored image URL.
     */
    public Mono<String> updateMyCover(Long currentUserId, UpdateCoverRequest request) {
        return imageService.uploadBase64IfPresent(request.getCoverBase64())
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.BAD_REQUEST, "Cover image is required")))
                .flatMap(coverUrl -> {
                    String finalUrl = coverUrl.trim();
                    return authRepository.updateCoverById(currentUserId.intValue(), finalUrl)
                            .thenReturn(finalUrl);
                })
                .doOnSuccess(v -> logger.info("updateMyCover: userId={} updated", currentUserId));
    }

    public Mono<UserOrganizationMemberResponse> getMyOrganizationMember(Long currentUserId, Integer organizationId) {
        return userOrganizationMemberRepository
                .findByOrganizationIdAndUserId(organizationId, currentUserId.intValue())
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.ORGANIZATION_MEMBER_NOT_FOUND))))
                .flatMap(member -> organizationRepository.findById(member.getOrganizationId())
                        .map(org -> toOrganizationMemberResponse(member, org.getName()))
                        .defaultIfEmpty(toOrganizationMemberResponse(member, null)))
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

    private UserOrganizationMemberResponse toOrganizationMemberResponse(OrganizationMember member, String organizationName) {
        return UserOrganizationMemberResponse.builder()
                .id(member.getId())
                .organizationId(member.getOrganizationId())
                .organizationName(organizationName)
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
