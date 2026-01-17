package com.service.backend.domain.repository;

import com.service.backend.domain.entity.User;
import com.service.backend.domain.entity.GlobalProfile;
import com.service.backend.domain.entity.GlobalIdentityVerification;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

/**
 * Repository interface for authentication and authorization operations
 */
public interface IAuthRepository {

    // User Registration & Login
    Mono<User> createUser(String email, String passwordHash);
    Mono<User> findUserByEmail(String email);
    Mono<User> findUserById(Long userId);
    Mono<User> updatePassword(Long userId, String newPasswordHash);

    // Profile Management
    Mono<GlobalProfile> createGlobalProfile(Long userId, GlobalProfile profileData);
    Mono<GlobalProfile> findGlobalProfileByUserId(Long userId);
    Mono<GlobalProfile> updateGlobalProfile(Long userId, GlobalProfile profileData);

    // Identity Verification
    Mono<GlobalIdentityVerification> createIdentityVerification(Long userId, GlobalIdentityVerification verificationData);
    Mono<GlobalIdentityVerification> findIdentityVerificationByUserId(Long userId);
    Mono<GlobalIdentityVerification> findIdentityVerificationByCitizenId(String citizenId);

    // Account Status
    Mono<User> activateUser(Long userId);
    Mono<User> deactivateUser(Long userId);

    // Password Reset
    Mono<Boolean> updatePasswordResetToken(Long userId, String token, LocalDateTime expiresAt);
    Mono<User> findUserByResetToken(String token);
    Mono<Boolean> clearPasswordResetToken(Long userId);

    // Email Verification
    Mono<User> updateEmailVerificationStatus(Long userId, Boolean isVerified);
}
