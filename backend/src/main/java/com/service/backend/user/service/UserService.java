package com.service.backend.user.service;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserProfileRepository userProfileRepository;
    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserLoginHistoryRepository userLoginHistoryRepository;
    private final UserNotificationSettingsRepository userNotificationSettingsRepository;
    private final UserOrganizationMemberRepository userOrganizationMemberRepository;

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
