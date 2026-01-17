package com.service.backend.othermodule.domain.repository;

import com.service.backend.authmodule.domain.entity.User;
import com.service.backend.othermodule.domain.entity.Organization;
import com.service.backend.othermodule.domain.entity.OrganizationMember;
import com.service.backend.othermodule.domain.entity.VerificationRequest;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Repository interface for admin operations
 * Handles user management, organization management, and content moderation
 */
public interface IAdminRepository {

    // User Management
    Mono<Map<String, Object>> findAllUsers(int page, int limit, Map<String, Object> filters);
    Mono<User> findUserById(Long userId);
    Mono<User> updateUserStatus(Long userId, Boolean isActive);
    Mono<Boolean> deleteUser(Long userId);

    // Organization Management
    Mono<Organization> createOrganization(Organization data);
    Mono<Organization> updateOrganization(Long organizationId, Organization data);
    Mono<Boolean> deleteOrganization(Long organizationId);
    Mono<Map<String, Object>> findAllOrganizations(int page, int limit);
    Mono<Organization> findOrganizationById(Long organizationId);

    // Organization Member Management
    Mono<Map<String, Object>> findMembersByOrganization(Long organizationId, int page, int limit);
    Mono<OrganizationMember> updateMemberStatus(Long memberId, String status);
    Mono<OrganizationMember> updateMemberVerificationLevel(Long memberId, Integer level);
    Mono<OrganizationMember> setTrustedVerifier(Long memberId, Boolean isTrusted);
    Mono<Boolean> removeMemberFromOrganization(Long memberId);

    // Verification Request Management
    Mono<Map<String, Object>> findPendingVerificationRequests(Long organizationId, int page, int limit);
    Mono<VerificationRequest> findVerificationRequestById(Long requestId);
    Mono<VerificationRequest> approveVerificationRequest(Long requestId, Long reviewerMemberId, String adminNote);
    Mono<VerificationRequest> rejectVerificationRequest(Long requestId, Long reviewerMemberId, String adminNote);

    // Content Moderation
    Mono<Boolean> hideContent(String contentType, Long contentId);
    Mono<Boolean> unhideContent(String contentType, Long contentId);

    // Statistics
    Mono<Map<String, Long>> getSystemStatistics();
}
