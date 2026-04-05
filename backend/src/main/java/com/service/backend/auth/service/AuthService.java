package com.service.backend.auth.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.auth.entity.User;
import com.service.backend.auth.dao.AuthRepository;
import com.service.backend.shared.service.EmailService;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.shared.utils.JwtUtils;

import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final Duration OTP_TTL = Duration.ofMinutes(5);
    private static final String OTP_CACHE_KEY = "otp_verification";
    private static final String OTP_EMAIL_SUBJECT = "Email Verification - OTP Code";
    private static final String OTP_EMAIL_TEMPLATE = "otpVerification";
    private static final String OTP_CACHE_OTP_FIELD = "otp";
    private static final String OTP_CACHE_USER_ID_FIELD = "userId";
    private static final int OTP_LENGTH = 6;
    private static final int OTP_MAX_VALUE = 1000000;
    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final CacheUtils cacheUtils;
    private final JwtUtils jwtUtils;
    private final SecureRandom secureRandom;
        
    public AuthService(AuthRepository authRepository, PasswordEncoder passwordEncoder, 
                      EmailService emailService, CacheUtils cacheUtils,
                      JwtUtils jwtUtils) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.cacheUtils = cacheUtils;
        this.jwtUtils = jwtUtils;
        this.secureRandom = new SecureRandom();
    }

    public Mono<Void> register(String email, String userName, String password, String fullName) {

        return authRepository.existsByEmailOrUserName(email, userName)
                .flatMap(exists -> {
                    if (exists) return Mono.error(new RuntimeException(ErrorCode.EMAIL_OR_USERNAME_ALREADY_REGISTERED.getMessage()));
                    return Mono.fromCallable(() -> passwordEncoder.encode(password))
                            .subscribeOn(Schedulers.boundedElastic())
                            .flatMap(hashedPassword ->
                                    authRepository.registerNewUser(email, userName, hashedPassword)
                                            .flatMap(userId -> 
                                                authRepository.createGlobalProfile(userId, fullName)
                            ));
                })
                .doOnError(e -> logger.error("Registration failed: {}", email, e));
    }

    public Mono<User> loginByEmail(String email, String password) {

        return authRepository.findByEmail(email)
                .flatMap(user -> {
                    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                        logger.warn("Login failed - invalid password for email: {}", email);
                        return Mono.error(new RuntimeException(ErrorCode.INVALID_CREDENTIALS.getMessage()));
                    }
                    
                    // Check if account is verified and active
                    if (user.getStatus() != com.service.backend.shared.enums.UserStatus.ACTIVE) {
                        logger.warn("Login failed - account not active for email: {}. Status: {}", email, user.getStatus());
                        return Mono.error(new RuntimeException(ErrorCode.ACCOUNT_NOT_VERIFIED.getMessage()));
                    }
                    
                    logger.info("Login successful for email: {}", email);
                    return Mono.just(user);
                })
                .switchIfEmpty(Mono.error(new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage())))
                .doOnError(error -> logger.error("Login error for email: {}", email, error));
    }

    public Mono<User> loginByUserName(String userName, String password) {

        return authRepository.findByUserName(userName)
                .flatMap(user -> {
                    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                        logger.warn("Login failed - invalid password for username: {}", userName);
                        return Mono.error(new RuntimeException(ErrorCode.INVALID_USERNAME_CREDENTIALS.getMessage()));
                    }
                    
                    // Check if account is verified and active
                    if (user.getStatus() != com.service.backend.shared.enums.UserStatus.ACTIVE) {
                        logger.warn("Login failed - account not active for username: {}. Status: {}", userName, user.getStatus());
                        return Mono.error(new RuntimeException(ErrorCode.ACCOUNT_NOT_VERIFIED.getMessage()));
                    }

                    logger.info("Login successful for username: {}", userName);
                    return Mono.just(user);
                })
                .switchIfEmpty(Mono.error(new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage())))
                .doOnError(error -> logger.error("Login error for username: {}", userName, error));
    }

    public Mono<Void> activateUser(Integer userId) {
        
        return authRepository.activateUserById(userId)
                .doOnSuccess(v -> logger.info("User activated successfully with id: {}", userId))
                .doOnError(error -> logger.error("Failed to activate user with id: {}", userId, error));
    }

    public Mono<Void> changePassword(Integer userId, String oldPassword, String newPassword) {

        return authRepository.findById(userId)
                .switchIfEmpty(Mono.error(new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage())))
                .flatMap(user -> {
                    if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
                        logger.warn("Password change failed - invalid old password for user id: {}", userId);
                        return Mono.error(new RuntimeException(ErrorCode.INVALID_OLD_PASSWORD.getMessage()));
                    }

                    String hashedPassword = passwordEncoder.encode(newPassword);
                    return authRepository.updatePasswordById(userId, hashedPassword)
                            .doOnSuccess(v -> logger.info("Password changed successfully for user id: {}", userId));
                })
                .doOnError(error -> logger.error("Password change error for user id: {}", userId, error));
    }

    public Mono<List<Integer>> getOrganizationIdByUserId(Integer userId) {
        return authRepository.getOrganizationIdByUserId(userId)
                .collectList()
                .doOnError(error -> logger.error("Failed to get organization ID for user id: {}", userId, error));
    }

    public Mono<Void> sendOtpVerification(String email) {

        return authRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage())))
                .flatMap(user -> {
                    // Generate cryptographically secure 6-digit OTP
                    String otp = String.format("%0" + OTP_LENGTH + "d", 
                            secureRandom.nextInt(OTP_MAX_VALUE));
                    logger.info("Generated OTP {} for email: {}", otp, email);

                    // Cache OTP and userId with TTL
                    Map<String, Object> cacheData = new HashMap<>();
                    cacheData.put(OTP_CACHE_OTP_FIELD, otp);
                    cacheData.put(OTP_CACHE_USER_ID_FIELD, user.getId());

                    return cacheUtils.putWithTtl(OTP_CACHE_KEY, email, cacheData, OTP_TTL)
                            .then(Mono.defer(() -> {
                                // Send OTP via email
                                Map<String, Object> variables = new HashMap<>();
                                variables.put(OTP_CACHE_OTP_FIELD, otp);
                                variables.put("email", email);

                                return emailService.sendHtmlEmail(
                                        email,
                                        OTP_EMAIL_SUBJECT,
                                        OTP_EMAIL_TEMPLATE,
                                        variables
                                );
                            }))
                            .doOnSuccess(v -> logger.info("OTP sent successfully to email: {}", email));
                })
                .doOnError(error -> logger.error("Failed to send OTP to email: {}", email, error));
    }

    public Mono<Void> verifyOtpAndActivate(String email, String otp) {

        return cacheUtils.get(OTP_CACHE_KEY, email)
                .switchIfEmpty(Mono.error(new RuntimeException(ErrorCode.OTP_EXPIRED_NOT_FOUND.getMessage())))
                .flatMap(cachedData -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> cacheMap = (Map<String, Object>) cachedData;
                    String cachedOtp = (String) cacheMap.get(OTP_CACHE_OTP_FIELD);
                    Integer userId = ((Number) cacheMap.get(OTP_CACHE_USER_ID_FIELD)).intValue();

                    if (!cachedOtp.equals(otp)) {
                        logger.warn("Invalid OTP provided for email: {}", email);
                        return Mono.error(new RuntimeException(ErrorCode.INVALID_OTP.getMessage()));
                    }

                    logger.info("OTP verified successfully for email: {}", email);

                    return authRepository.activateUserById(userId)
                            .doOnSuccess(v -> logger.info("User account activated for email: {}", email))
                            .then(cacheUtils.evict(OTP_CACHE_KEY, email));
                })
                .doOnError(error -> logger.error("OTP verification failed for email: {}", email, error));
    }

    /**
     * Refresh access token using refresh token
     */
    public Mono<String> refreshAccessToken(String refreshToken) {

        if (!StringUtils.hasText(refreshToken)) {
            return Mono.error(new RuntimeException(ErrorCode.REFRESH_TOKEN_NOT_FOUND.getMessage()));
        }

        // Use reactive approach: wrap token validation in Mono.fromCallable
        return Mono.fromCallable(() -> jwtUtils.getUserIdFromToken(refreshToken))
                .onErrorMap(e -> new RuntimeException(ErrorCode.INVALID_REFRESH_TOKEN.getMessage(), e))
                .flatMap(userId -> 
                    authRepository.findById(userId)
                            .switchIfEmpty(Mono.error(new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage())))
                            .flatMap(user -> 
                                authRepository.getOrganizationIdByUserId(userId)
                                        .collectList()
                                        .defaultIfEmpty(List.of())
                                        .map(organizationIds -> {
                                            String accessToken = jwtUtils.generateAccessToken(
                                                    user.getId(),
                                                    user.getEmail(),
                                                    user.getRole().name(),
                                                    user.getUserName(),
                                                    user.getAvatarUrl(),
                                                    organizationIds
                                            );
                                            logger.info("Access token refreshed successfully for user id: {}", userId);
                                            return accessToken;
                                        })
                            )
                            .doOnError(error -> logger.error("Failed to refresh token", error))
                );
    }
}
