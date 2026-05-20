package com.service.backend.user.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.service.backend.auth.dao.AuthRepository;
import com.service.backend.admin.entity.OrganizationMember;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
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

                    existing.setUpdatedAt(LocalDateTime.now());
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
                        request.getProgram(),
                        request.getGraduatedYear(),
                        request.getGraduationStatus(),
                        request.getMajor())
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
                .graduatedYear(member.getGraduatedYear())
                .graduationStatus(member.getGraduationStatus())
                .program(member.getProgram())
                .major(member.getMajor())
                .verificationLevel(member.getVerificationLevel())
                .isTrustedVerifier(member.getIsTrustedVerifier())
                .status(member.getStatus())
                .createdAt(member.getCreatedAt())
                .updatedAt(member.getUpdatedAt())
                .build();
    }
}
