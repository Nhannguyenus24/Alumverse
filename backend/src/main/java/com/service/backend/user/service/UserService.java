package com.service.backend.user.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.service.backend.shared.enums.UserRole;
import com.service.backend.shared.enums.UserStatus;
import com.service.backend.user.dao.UserRepository;
import com.service.backend.user.dao.UserRepository.OrganizationMembershipView;
import com.service.backend.user.dao.UserRepository.UserProfileView;
import com.service.backend.user.dao.OrganizationMemberRepository;
import com.service.backend.user.dto.JoinOrganizationRequest;
import com.service.backend.user.dto.OrganizationMembershipResponse;
import com.service.backend.user.dto.UserProfileResponse;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Service for user profile and organization membership operations
 */
@Service
public class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    private final UserRepository userRepository;
    private final OrganizationMemberRepository memberRepository;
    
    public UserService(UserRepository userRepository, OrganizationMemberRepository memberRepository) {
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
    }
    
    /**
     * Get user profile by user ID
     * Includes user data and global profile information
     */
    public Mono<UserProfileResponse> getUserProfile(Integer userId) {
        logger.info("Fetching profile for user: {}", userId);
        
        return userRepository.findUserProfile(userId)
                .map(this::mapToUserProfileResponse)
                .doOnError(error -> logger.error("Error fetching profile for user: {}", userId, error))
                .switchIfEmpty(Mono.error(new RuntimeException("User not found")));
    }
    
    /**
     * Get all organizations user is member of
     */
    public Flux<OrganizationMembershipResponse> getUserOrganizations(Integer userId) {
        logger.info("Fetching organizations for user: {}", userId);
        
        return userRepository.findUserOrganizations(userId)
                .map(this::mapToOrganizationMembershipResponse)
                .doOnError(error -> logger.error("Error fetching organizations for user: {}", userId, error));
    }
    
    /**
     * Get single organization membership details
     */
    public Mono<OrganizationMembershipResponse> getOrganizationMembership(Integer userId, Integer organizationId) {
        logger.info("Fetching organization {} membership for user: {}", organizationId, userId);
        
        return userRepository.findMembershipByUserAndOrg(userId, organizationId)
                .map(this::mapToOrganizationMembershipResponse)
                .doOnError(error -> logger.error("Error fetching org membership: {}", organizationId, error))
                .switchIfEmpty(Mono.error(new RuntimeException("User is not a member of this organization")));
    }
    
    /**
     * Check if user is already member of an organization
     */
    public Mono<Boolean> isUserMemberOfOrganization(Integer userId, Integer organizationId) {
        logger.info("Checking if user {} is member of org: {}", userId, organizationId);
        
        return userRepository.countMembershipByUserAndOrg(userId, organizationId)
                .map(count -> count > 0)
                .doOnError(error -> logger.error("Error checking membership: userId={}, orgId={}", userId, organizationId, error));
    }
    
    /**
     * Join user to an organization
     * Creates an organization member record if user is not already member
     */
    public Mono<OrganizationMembershipResponse> joinOrganization(Integer userId, JoinOrganizationRequest request) {
        logger.info("User {} attempting to join organization {}", userId, request.getOrganizationId());
        
        return isUserMemberOfOrganization(userId, request.getOrganizationId())
                .flatMap(isMember -> {
                    if (isMember) {
                        logger.warn("User {} is already member of organization {}", userId, request.getOrganizationId());
                        return Mono.error(new RuntimeException("User is already a member of this organization"));
                    }
                    
                    // Create membership
                    return memberRepository.createMembership(request.getOrganizationId(), userId)
                            .flatMap(memberId -> {
                                logger.info("Successfully created membership {} for user {} in org {}", 
                                    memberId, userId, request.getOrganizationId());
                                // Fetch the newly created membership
                                return getOrganizationMembership(userId, request.getOrganizationId());
                            });
                })
                .doOnError(error -> logger.error("Error joining organization: userId={}, orgId={}", 
                    userId, request.getOrganizationId(), error));
    }
    
    /**
     * Map UserProfileView to UserProfileResponse DTO
     */
    private UserProfileResponse mapToUserProfileResponse(UserProfileView view) {
        return UserProfileResponse.builder()
                .id(view.getId())
                .email(view.getEmail())
                .userName(view.getUserName())
                .status(UserStatus.valueOf(view.getStatus()))
                .role(UserRole.valueOf(view.getRole()))
                .avatarUrl(view.getAvatarUrl())
                .fullName(view.getFullName())
                .phone(view.getPhone())
                .bio(view.getBio())
                .createdAt(view.getCreatedAt())
                .updatedAt(view.getUpdatedAt())
                .build();
    }
    
    /**
     * Map OrganizationMembershipView to OrganizationMembershipResponse DTO
     */
    private OrganizationMembershipResponse mapToOrganizationMembershipResponse(OrganizationMembershipView view) {
        return OrganizationMembershipResponse.builder()
                .id(view.getId())
                .organizationId(view.getOrganizationId())
                .organizationName(view.getOrganizationName())
                .organizationSlug(view.getOrganizationSlug())
                .organizationLogoUrl(view.getOrganizationLogoUrl())
                .verificationLevel(view.getVerificationLevel())
                .isTrustedVerifier(view.getIsTrustedVerifier())
                .status(view.getStatus())
                .build();
    }
}
