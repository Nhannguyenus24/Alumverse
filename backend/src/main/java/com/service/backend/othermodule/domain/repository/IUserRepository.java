package com.service.backend.othermodule.domain.repository;

import com.service.backend.authmodule.domain.entity.GlobalProfile;
import com.service.backend.othermodule.domain.entity.OrganizationMember;
import com.service.backend.othermodule.domain.entity.AcademicRecord;
import com.service.backend.othermodule.domain.entity.Achievement;
import com.service.backend.othermodule.domain.entity.SavedItem;
import com.service.backend.othermodule.domain.entity.Notification;
import com.service.backend.othermodule.domain.entity.PeerVerification;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Repository interface for user-related operations
 * Handles user profiles, achievements, saved items, notifications, etc.
 */
public interface IUserRepository {

    // Profile Management
    Mono<GlobalProfile> findGlobalProfileByUserId(Long userId);
    Mono<GlobalProfile> updateGlobalProfile(Long userId, GlobalProfile profileData);

    // Organization Membership
    Mono<OrganizationMember> joinOrganization(Long userId, Long organizationId, OrganizationMember memberData);
    Mono<Boolean> leaveOrganization(Long memberId);
    Mono<OrganizationMember> findMemberByUserAndOrg(Long userId, Long organizationId);
    Mono<OrganizationMember> findMemberById(Long memberId);
    Flux<OrganizationMember> findOrganizationsByUser(Long userId);
    Mono<OrganizationMember> updateMemberProfile(Long memberId, OrganizationMember memberData);

    // Academic Record Management
    Mono<AcademicRecord> createAcademicRecord(AcademicRecord recordData);
    Mono<AcademicRecord> updateAcademicRecord(Long recordId, AcademicRecord recordData);
    Mono<Boolean> deleteAcademicRecord(Long recordId);
    Flux<AcademicRecord> findAcademicRecordsByMember(Long memberId);
    Mono<AcademicRecord> findAcademicRecordById(Long recordId);

    // Achievement Management
    Mono<Achievement> createAchievement(Achievement achievementData);
    Mono<Achievement> updateAchievement(Long achievementId, Achievement achievementData);
    Mono<Boolean> deleteAchievement(Long achievementId);
    Mono<Map<String, Object>> findAchievementsByMember(Long memberId, int page, int limit, Map<String, Object> filters);
    Mono<Achievement> findAchievementById(Long achievementId);
    Mono<Achievement> approveAchievement(Long achievementId);
    Mono<Achievement> rejectAchievement(Long achievementId);

    // Saved Items Management
    Mono<SavedItem> saveItem(Long memberId, String itemType, Long itemId, String note);
    Mono<Boolean> unsaveItem(Long memberId, String itemType, Long itemId);
    Mono<Map<String, Object>> findSavedItemsByMember(Long memberId, int page, int limit, Map<String, Object> filters);
    Mono<Boolean> checkItemSaved(Long memberId, String itemType, Long itemId);

    // Notification Management
    Mono<Notification> createNotification(Notification notificationData);
    Mono<Map<String, Object>> findNotificationsByMember(Long memberId, int page, int limit, Boolean unreadOnly);
    Mono<Notification> markNotificationAsRead(Long notificationId);
    Mono<Boolean> markAllNotificationsAsRead(Long memberId);
    Mono<Boolean> deleteNotification(Long notificationId);
    Mono<Long> countUnreadNotifications(Long memberId);

    // Peer Verification Management
    Mono<PeerVerification> createPeerVerification(Long targetMemberId, Long verifierMemberId);
    Flux<PeerVerification> findPeerVerificationsByTarget(Long targetMemberId);
    Flux<PeerVerification> findPeerVerificationsByVerifier(Long verifierMemberId);
    Mono<Boolean> checkPeerVerificationExists(Long targetMemberId, Long verifierMemberId);
    Mono<Long> countPeerVerifications(Long targetMemberId);

    // User Statistics
    Mono<Map<String, Object>> getUserStatistics(Long memberId);
}
