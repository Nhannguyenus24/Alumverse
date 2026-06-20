package com.service.backend.user.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.user.dto.ChangeMyPasswordRequest;
import com.service.backend.user.dto.CreateVerificationRequest;
import com.service.backend.user.dto.DirectVerifyRequest;
import com.service.backend.user.dto.NotificationResponse;
import com.service.backend.user.dto.NotificationSettingsResponse;
import com.service.backend.user.dto.PendingPeerVerificationResponse;
import com.service.backend.user.dto.RequestPeerVerificationRequest;
import com.service.backend.user.dto.UpdateAvatarRequest;
import com.service.backend.user.dto.UpdateMyProfileRequest;
import com.service.backend.user.dto.UpdateNotificationSettingsRequest;
import com.service.backend.user.dto.UserLoginHistoryResponse;
import com.service.backend.user.dto.UserOrganizationMemberResponse;
import com.service.backend.user.dto.UserProfileResponse;
import com.service.backend.user.service.NotificationService;
import com.service.backend.user.service.UserService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Users > Profile", description = "API endpoints for user profile management")
@RestController
@RequestMapping("/api/users/me")
@Validated
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final NotificationService notificationService;

    @GetMapping("/profile")
    public Mono<ResponseEntity<ApiResponse<UserProfileResponse>>> getMyProfile() {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userService::getMyProfile)
                .map(profile -> ResponseEntity.ok(new ApiResponse<>("Profile retrieved successfully", profile)));
    }

    @PutMapping("/profile")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> updateMyProfile(
            @Valid @RequestBody UpdateMyProfileRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> userService.updateMyProfile(userId, request))
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("Profile updated successfully", true)));
    }

    @PutMapping("/avatar")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> updateMyAvatar(
            @Valid @RequestBody UpdateAvatarRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> userService.updateMyAvatar(userId, request.getAvatarUrl()))
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("Avatar updated successfully", true)));
    }

    @GetMapping("/organization-member")
    public Mono<ResponseEntity<ApiResponse<UserOrganizationMemberResponse>>> getMyOrganizationMember(
            @RequestParam @Min(1) Integer organizationId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> userService.getMyOrganizationMember(userId, organizationId))
                .map(member -> ResponseEntity.ok(new ApiResponse<>("Organization member retrieved successfully", member)));
    }

    @PutMapping("/password")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> changeMyPassword(@Valid @RequestBody ChangeMyPasswordRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> userService.changeMyPassword(userId, request.getOldPassword(), request.getNewPassword()))
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("Password changed successfully", true)));
    }

    @GetMapping("/login-history")
    public Mono<ResponseEntity<ApiResponse<List<UserLoginHistoryResponse>>>> getMyLoginHistory(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int limit) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> userService.getMyLoginHistory(userId, page, limit))
                .map(history -> ResponseEntity.ok(new ApiResponse<>("Login history retrieved successfully", history)));
    }

    @GetMapping("/notification-settings")
    public Mono<ResponseEntity<ApiResponse<NotificationSettingsResponse>>> getMyNotificationSettings() {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userService::getMyNotificationSettings)
                .map(settings -> ResponseEntity.ok(new ApiResponse<>("Notification settings retrieved successfully", settings)));
    }

    @PutMapping("/notification-settings")
    public Mono<ResponseEntity<ApiResponse<NotificationSettingsResponse>>> updateMyNotificationSettings(
            @RequestBody UpdateNotificationSettingsRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> userService.updateMyNotificationSettings(userId, request))
                .map(settings -> ResponseEntity.ok(new ApiResponse<>("Notification settings updated successfully", settings)));
    }

    @GetMapping("/notifications")
    public Mono<ResponseEntity<ApiResponse<List<NotificationResponse>>>> getMyNotifications() {
        return SecurityUtils.getCurrentUserId()
                .flatMap(notificationService::getMyNotifications)
                .map(notifications -> ResponseEntity.ok(new ApiResponse<>("Notifications retrieved successfully", notifications)));
    }

    @PutMapping("/notifications/{notificationId}/read")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> markNotificationAsRead(
            @PathVariable @Min(1) Integer notificationId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> notificationService.markAsRead(userId, notificationId))
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("Notification marked as read", true)));
    }

    @DeleteMapping("/notifications/{notificationId}")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> deleteNotification(
            @PathVariable @Min(1) Integer notificationId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> notificationService.deleteNotification(userId, notificationId))
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("Notification deleted successfully", true)));
    }

    @DeleteMapping("/notifications")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> deleteAllNotifications() {
        return SecurityUtils.getCurrentUserId()
                .flatMap(notificationService::deleteAllNotifications)
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("All notifications deleted successfully", true)));
    }

    @PostMapping("/verification-requests")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> createVerificationRequest(
            @Valid @RequestBody CreateVerificationRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> userService.createVerificationRequest(userId, request))
                .thenReturn(ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Verification request submitted successfully", true)));
    }

    @PostMapping("/peer-verifications/request")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> requestPeerVerification(
            @Valid @RequestBody RequestPeerVerificationRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> userService.requestPeerVerification(userId, request.getOrganizationId(), request.getVerifierUserId()))
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("Peer verification requested successfully", true)));
    }

    @PatchMapping("/peer-verifications/{requestId}/accept")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> acceptPeerVerification(
            @PathVariable @Min(1) Integer requestId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> userService.acceptPeerVerification(userId, requestId))
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("Peer verification accepted successfully", true)));
    }

    @PostMapping("/peer-verifications/direct")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> directVerify(
            @Valid @RequestBody DirectVerifyRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> userService.directVerify(userId, request.getOrganizationId(), request.getTargetUserId()))
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("User verified directly successfully", true)));
    }

    @GetMapping("/peer-verifications/pending")
    public Mono<ResponseEntity<ApiResponse<List<PendingPeerVerificationResponse>>>> getPendingPeerVerifications(
            @RequestParam @Min(1) Integer organizationId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> userService.getPendingPeerVerifications(userId, organizationId))
                .map(requests -> ResponseEntity.ok(new ApiResponse<>("Pending peer verifications retrieved successfully", requests)));
    }
}
