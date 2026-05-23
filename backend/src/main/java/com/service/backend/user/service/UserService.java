package com.service.backend.user.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.service.backend.auth.dao.AuthRepository;
import com.service.backend.admin.entity.OrganizationMember;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.user.dao.UserLoginHistoryRepository;
import com.service.backend.user.dao.UserNotificationSettingsRepository;
import com.service.backend.user.dao.UserOrganizationMemberRepository;
import com.service.backend.user.dao.UserProfileRepository;
import com.service.backend.user.dao.PeerVerificationRepository;
import com.service.backend.user.entity.PeerVerification;
import com.service.backend.user.dto.CreateVerificationRequest;
import com.service.backend.shared.service.FileUploadService;
import com.service.backend.user.dto.NotificationSettingsResponse;
import com.service.backend.user.dto.UpdateMyProfileRequest;
import com.service.backend.user.dto.UpdateNotificationSettingsRequest;
import com.service.backend.user.dto.UserLoginHistoryResponse;
import com.service.backend.user.dto.UserOrganizationMemberResponse;
import com.service.backend.user.dto.UserProfileResponse;
import com.service.backend.user.entity.UserNotificationSettings;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserProfileRepository userProfileRepository;
    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserLoginHistoryRepository userLoginHistoryRepository;
    private final UserNotificationSettingsRepository userNotificationSettingsRepository;
    private final UserOrganizationMemberRepository userOrganizationMemberRepository;
    private final PeerVerificationRepository peerVerificationRepository;
    private final FileUploadService fileUploadService;

    public Mono<Void> createVerificationRequest(Long currentUserId, CreateVerificationRequest request) {
        return fileUploadService.uploadBase64File(request.getBase64File(), request.getOriginalFileName())
                .flatMap(fileUrl -> {
                    // member_id in verification_requests corresponds to user_id in users table according to AdminUserRepository.findAllVerificationRequests join
                    // where "JOIN users u ON vr.member_id = u.id"
                    return authRepository.insertVerificationRequest(
                            currentUserId.intValue(),
                            fileUrl,
                            request.getDocumentType()
                    );
                });
    }

    public Mono<Void> requestPeerVerification(Long currentUserId, Integer organizationId, Integer verifierUserId) {
        return Mono.zip(
                userOrganizationMemberRepository.findByOrganizationIdAndUserId(organizationId, currentUserId.intValue()),
                userOrganizationMemberRepository.findByOrganizationIdAndUserId(organizationId, verifierUserId))
                .flatMap(tuple -> {
                    OrganizationMember targetMember = tuple.getT1();
                    OrganizationMember verifierMember = tuple.getT2();

                    return peerVerificationRepository.findPendingRequest(targetMember.getId(), verifierMember.getId())
                            .hasElement()
                            .flatMap(exists -> {
                                if (exists) {
                                    return Mono.error(new ApplicationException(ErrorCode.RESOURCES_DUPLICATE, "Pending verification request already exists"));
                                }
                                return peerVerificationRepository.save(PeerVerification.builder()
                                        .targetMemberId(targetMember.getId())
                                        .verifierMemberId(verifierMember.getId())
                                        .status("pending")
                                        .build());
                            });
                })
                .then();
    }

    public Mono<Void> acceptPeerVerification(Long currentUserId, Integer requestId) {
        return peerVerificationRepository.findById(requestId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Verification request not found")))
                .flatMap(request -> {
                    if (!"pending".equals(request.getStatus())) {
                        return Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST, "Request is not in pending status"));
                    }

                    return userOrganizationMemberRepository.findById(request.getVerifierMemberId())
                            .flatMap(verifier -> {
                                if (!verifier.getUserId().equals(currentUserId.intValue())) {
                                    return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "You are not the assigned verifier for this request"));
                                }
                                if (Boolean.FALSE.equals(verifier.getIsTrustedVerifier())) {
                                    return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Only trusted verifiers can accept verification requests"));
                                }

                                return peerVerificationRepository.updateStatus(requestId, "accepted")
                                        .then(userOrganizationMemberRepository.findById(request.getTargetMemberId()))
                                        .flatMap(target -> {
                                            target.setVerificationLevel(target.getVerificationLevel() + 1);
                                            return userOrganizationMemberRepository.save(target);
                                        });
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
                                    .targetMemberId(targetMember.getId())
                                    .verifierMemberId(verifierMember.getId())
                                    .status("accepted")
                                    .build())
                            .then(Mono.defer(() -> {
                                targetMember.setVerificationLevel(targetMember.getVerificationLevel() + 1);
                                return userOrganizationMemberRepository.save(targetMember);
                            }));
                })
                .then();
    }

    public Mono<UserProfileResponse> getMyProfile(Long currentUserId) {
        return userProfileRepository.findProfileByUserId(currentUserId.intValue())
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(
                        ErrorCode.USER_NOT_FOUND,
                        "User not found with id: " + currentUserId))));
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
                });
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
                .collectList();
    }

    public Mono<NotificationSettingsResponse> getMyNotificationSettings(Long currentUserId) {
        return userNotificationSettingsRepository.findById(currentUserId.intValue())
                .map(this::toNotificationResponse)
                .defaultIfEmpty(defaultNotificationSettings(currentUserId.intValue()));
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
                .map(this::toNotificationResponse);
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

        return updateGlobalProfile.then(updateOrganizationMember).then();
    }

    public Mono<UserOrganizationMemberResponse> getMyOrganizationMember(Long currentUserId, Integer organizationId) {
        return userOrganizationMemberRepository
                .findByOrganizationIdAndUserId(organizationId, currentUserId.intValue())
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.ORGANIZATION_MEMBER_NOT_FOUND))))
                .map(this::toOrganizationMemberResponse);
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
                .graduationStatus(parseStringList(member.getGraduationStatus()))
                .program(parseStringList(member.getProgram()))
                .major(parseStringList(member.getMajor()))
                .verificationLevel(member.getVerificationLevel())
                .isTrustedVerifier(member.getIsTrustedVerifier())
                .status(member.getStatus())
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
