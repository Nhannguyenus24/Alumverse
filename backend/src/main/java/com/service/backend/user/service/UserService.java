package com.service.backend.user.service;

import java.util.Optional;

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
            .doOnNext(org -> logger.info(
                "Found organization membership for user {}: orgId={}, slug={}, verificationLevel={}",
                userId,
                org.getOrganizationId(),
                org.getOrganizationSlug(),
                org.getVerificationLevel()))
                .doOnError(error -> logger.error("Error fetching organizations for user: {}", userId, error));
    }
    
    /**
     * Get single organization membership details
     */
    public Mono<OrganizationMembershipResponse> getOrganizationMembership(Integer userId, Integer organizationId) {
        logger.info("Fetching organization {} membership for user: {}", organizationId, userId);

        Mono<Optional<Integer>> rawVerificationMono = userRepository
            .findRawVerificationLevelByUserAndOrg(userId, organizationId)
            .map(Optional::of)
            .defaultIfEmpty(Optional.empty())
            .doOnNext(raw -> logger.info(
                "Raw DB verification_level lookup: userId={}, orgId={}, rawVerificationLevel={}",
                userId,
                organizationId,
                raw.orElse(null)));

        return rawVerificationMono.flatMap(rawVerification -> userRepository.findMembershipByUserAndOrg(userId, organizationId)
            .doOnNext(view -> logger.info(
                "Projection values: userId={}, orgId={}, membershipId={}, projectionVerificationLevel={}, rawVerificationLevel={}",
                userId,
                organizationId,
                view.getId(),
                view.getVerificationLevel(),
                rawVerification.orElse(null)))
            .map(this::mapToOrganizationMembershipResponse)
            .map(membership -> {
                if (membership.getVerificationLevel() == null && rawVerification.isPresent()) {
                    logger.warn(
                        "Projection mapping lost verificationLevel, force value from raw DB: userId={}, orgId={}, membershipId={}, forcedVerificationLevel={}",
                        userId,
                        organizationId,
                        membership.getId(),
                        rawVerification.get());
                    membership.setVerificationLevel(rawVerification.get());
                }
                return membership;
            })
            .doOnNext(membership -> logger.info(
                "DTO values: userId={}, orgId={}, membershipId={}, dtoVerificationLevel={}, rawVerificationLevel={}",
                userId,
                organizationId,
                membership.getId(),
                membership.getVerificationLevel(),
                rawVerification.orElse(null)))
            .doOnError(error -> logger.error("Error fetching org membership: {}", organizationId, error))
            .switchIfEmpty(Mono.defer(() -> {
                logger.warn("No membership found for userId={} in orgId={} (rawVerificationLevel={})",
                    userId,
                    organizationId,
                    rawVerification.orElse(null));
                return Mono.error(new RuntimeException("User is not a member of this organization"));
            })));
    }
    
    /**
     * Check if user is already member of an organization
     */
    public Mono<Boolean> isUserMemberOfOrganization(Integer userId, Integer organizationId) {
        logger.info("Checking if user {} is member of org: {}", userId, organizationId);
        
        return userRepository.countMembershipByUserAndOrg(userId, organizationId)
                .map(count -> count > 0)
            .doOnNext(isMember -> logger.info(
                "Membership check result: userId={}, orgId={}, isMember={}",
                userId,
                organizationId,
                isMember))
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

                    logger.info("User {} is not a member of org {}, creating new membership", userId, request.getOrganizationId());
                    
                    // Create membership
                    return memberRepository.createMembership(request.getOrganizationId(), userId)
                            .flatMap(memberId -> {
                                logger.info("Successfully created membership {} for user {} in org {}", 
                                    memberId, userId, request.getOrganizationId());
                                // Fetch the newly created membership
                                return getOrganizationMembership(userId, request.getOrganizationId());
                            });
                })
                .doOnSuccess(membership -> {
                    if (membership != null) {
                        logger.info("Join organization flow completed: userId={}, orgId={}, membershipId={}",
                                userId,
                                request.getOrganizationId(),
                                membership.getId());
                    }
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
        Integer verificationLevel = view.getVerificationLevel();
        if (verificationLevel == null) {
            verificationLevel = view.getVerification_level();
            logger.warn("Projection camelCase verificationLevel is null; fallback snake_case value={}", verificationLevel);
        }

        return OrganizationMembershipResponse.builder()
                .id(view.getId())
                .organizationId(view.getOrganizationId())
                .organizationName(view.getOrganizationName())
                .organizationSlug(view.getOrganizationSlug())
                .organizationLogoUrl(view.getOrganizationLogoUrl())
                .verificationLevel(verificationLevel)
                .isTrustedVerifier(view.getIsTrustedVerifier())
                .status(view.getStatus())
                .build();
    }
}
