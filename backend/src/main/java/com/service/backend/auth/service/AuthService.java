package com.service.backend.auth.service;

import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.AbstractMap;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import com.service.backend.shared.exception.ApplicationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.service.backend.auth.dto.LoginResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.entity.User;
import com.service.backend.auth.dao.AuthRepository;
import com.service.backend.shared.service.EmailService;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.JwtUtils;
import com.service.backend.user.dao.UserLoginHistoryRepository;
import com.service.backend.shared.entity.UserLoginHistory;
import com.service.backend.shared.enums.Status;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import com.service.backend.user.service.NotificationService;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final Duration OTP_TTL = Duration.ofMinutes(5);
    private static final String GOOGLE_TOKEN_INFO_PATH = "/tokeninfo";
    private static final String GOOGLE_ISSUER = "accounts.google.com";
    private static final String GOOGLE_ISSUER_HTTPS = "https://accounts.google.com";
    private static final String GOOGLE_LOGIN_METHOD = "GOOGLE";
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
    private final UserLoginHistoryRepository userLoginHistoryRepository;
    private final WebClient googleApiClient;
    private final String googleClientId;
    private final SecureRandom secureRandom;
    private final NotificationService notificationService;

    public AuthService(AuthRepository authRepository, PasswordEncoder passwordEncoder,
                      EmailService emailService, CacheUtils cacheUtils,
                      JwtUtils jwtUtils,
                      UserLoginHistoryRepository userLoginHistoryRepository,
                      WebClient.Builder webClientBuilder,
                      @Value("${google.oauth.client-id:}") String googleClientId,
                      NotificationService notificationService) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.cacheUtils = cacheUtils;
        this.jwtUtils = jwtUtils;
        this.userLoginHistoryRepository = userLoginHistoryRepository;
        this.googleApiClient = webClientBuilder.baseUrl("https://oauth2.googleapis.com").build();
        this.googleClientId = googleClientId == null ? "" : googleClientId.trim();
        this.secureRandom = new SecureRandom();
        this.notificationService = notificationService;
    }

    @Transactional
    public Mono<Void> register(String email, String studentId, String password, String fullName, Integer organizationId) {
        return authRepository.existsByEmail(email)
                .flatMap(exists -> {
                    if (exists) return Mono.error(new ApplicationException(ErrorCode.EMAIL_ALREADY_EXISTS));
                    return Mono.fromCallable(() -> passwordEncoder.encode(password))
                            .subscribeOn(Schedulers.boundedElastic())
                            .flatMap(hashedPassword ->
                                    authRepository.registerNewUser(email, hashedPassword)
                                            .flatMap(userId ->
                                                authRepository.createGlobalProfile(userId, fullName)
                                                        .then(authRepository.createOrganizationMember(organizationId, userId, studentId))
                            ));
                })
                .doOnError(e -> logger.error("Registration failed: {}", e.getMessage()));
    }

    public Mono<User> loginByEmail(String email, String password, Integer organizationId, String userAgent, String loginIp) {
        return authRepository.findByEmail(email)
                .flatMap(user -> {
                    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                        logger.warn("Login failed - invalid password for email: {}", email);
                        return Mono.error(new ApplicationException(ErrorCode.INVALID_CREDENTIALS));
                    }

                    if (user.getStatus() != Status.ACTIVE) {
                        logger.warn("Login failed - account not active for email: {}. Status: {}", email, user.getStatus());
                        return Mono.error(new ApplicationException(ErrorCode.ACCOUNT_NOT_VERIFIED));
                    }

                    if (organizationId != null) {
                        return authRepository.existsOrganizationMemberByUserIdAndOrgId(user.getId(), organizationId)
                                .flatMap(isMember -> {
                                    if (Boolean.FALSE.equals(isMember)) {
                                        logger.warn("Login failed - user {} is not a member of organization {}", email, organizationId);
                                        return Mono.error(new ApplicationException(ErrorCode.USER_NOT_MEMBER_OF_ORGANIZATION));
                                    }
                                    recordLoginSuccessAsync(user.getId(), "EMAIL", userAgent, loginIp);
                                    return Mono.just(user);
                                });
                    } else {
                        recordLoginSuccessAsync(user.getId(), "EMAIL", userAgent, loginIp);
                        return Mono.just(user);
                    }
                })
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND)))
                .doOnSuccess(u -> logger.info("loginByEmail result: {}", JsonUtils.toJson(u)))
                .doOnError(error -> logger.error("Login error for email: {} - {}", email, error.getMessage()));
    }



    public Mono<User> loginWithGoogle(String idToken, Integer organizationId, String userAgent, String loginIp) {
        if (!StringUtils.hasText(googleClientId)) {
            return Mono.error(new ApplicationException(ErrorCode.GOOGLE_LOGIN_NOT_CONFIGURED));
        }
        if (!StringUtils.hasText(idToken)) {
            return Mono.error(new ApplicationException(ErrorCode.GOOGLE_TOKEN_REQUIRED));
        }
        if (organizationId == null || organizationId <= 0) {
            return Mono.error(new ApplicationException(ErrorCode.ORGANIZATION_ID_REQUIRED));
        }

        return verifyGoogleToken(idToken)
                .flatMap(tokenInfo -> authRepository.findByEmail(tokenInfo.email())
                        .flatMap(existingUser -> loginExistingGoogleUser(existingUser, tokenInfo.picture(), organizationId, userAgent, loginIp))
                        .switchIfEmpty(registerGoogleUser(tokenInfo, organizationId, userAgent, loginIp))
                )
                .doOnSuccess(u -> logger.info("loginWithGoogle result: {}", JsonUtils.toJson(u)))
                .doOnError(error -> logger.error("Google login failed: {}", error.getMessage()));
    }

    public Mono<Void> activateUser(Integer userId) {
        return authRepository.activateUserById(userId)
                .doOnSuccess(v -> logger.info("activateUser: userId={} activated", userId))
                .doOnError(error -> logger.error("Failed to activate user with id: {}", error.getMessage()));
    }

    public Mono<Void> resetPasswordWithOtp(String email, String otp, String newPassword) {
        return cacheUtils.get(OTP_CACHE_KEY, email)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.OTP_EXPIRED_NOT_FOUND)))
                .flatMap(cachedData -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> cacheMap = (Map<String, Object>) cachedData;
                    String cachedOtp = (String) cacheMap.get(OTP_CACHE_OTP_FIELD);
                    Integer userId = ((Number) cacheMap.get(OTP_CACHE_USER_ID_FIELD)).intValue();

                    if (!cachedOtp.equals(otp)) {
                        logger.warn("Invalid OTP for password reset, email: {}", email);
                        return Mono.error(new ApplicationException(ErrorCode.INVALID_OTP));
                    }

                    return Mono.fromCallable(() -> passwordEncoder.encode(newPassword))
                            .subscribeOn(Schedulers.boundedElastic())
                            .flatMap(hashedPassword -> authRepository.updatePasswordById(userId, hashedPassword))
                            .then(cacheUtils.evict(OTP_CACHE_KEY, email));
                })
                .doOnSuccess(v -> logger.info("resetPasswordWithOtp: password reset for email={}", email))
                .doOnError(error -> logger.error("Password reset failed for email: {}", error.getMessage()));
    }

    public Mono<Void> changePassword(Integer userId, String oldPassword, String newPassword) {
        return authRepository.findById(userId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND)))
                .flatMap(user -> {
                    if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
                        logger.warn("Password change failed - invalid old password for user id: {}", userId);
                        return Mono.error(new ApplicationException(ErrorCode.INVALID_OLD_PASSWORD));
                    }

                    return Mono.fromCallable(() -> passwordEncoder.encode(newPassword))
                            .subscribeOn(Schedulers.boundedElastic())
                            .flatMap(hashedPassword -> authRepository.updatePasswordById(userId, hashedPassword))
                            .doOnSuccess(v -> logger.info("changePassword: userId={} password changed", userId));
                })
                .doOnError(error -> logger.error("Password change error for user id: {}", error.getMessage()));
    }

    public Mono<Integer> getVerificationLevel(Integer userId, Integer organizationId) {
        return authRepository.getVerificationLevelByUserIdAndOrgId(userId, organizationId);
    }

    public Mono<Void> sendOtpVerification(String email) {
        return authRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND)))
                .flatMap(user -> {
                    String otp = String.format("%0" + OTP_LENGTH + "d",
                            secureRandom.nextInt(OTP_MAX_VALUE));

                    Map<String, Object> cacheData = new HashMap<>();
                    cacheData.put(OTP_CACHE_OTP_FIELD, otp);
                    cacheData.put(OTP_CACHE_USER_ID_FIELD, user.getId());

                    return cacheUtils.putWithTtl(OTP_CACHE_KEY, email, cacheData, OTP_TTL)
                            .then(Mono.defer(() -> {
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
                            .doOnSuccess(v -> logger.info("sendOtpVerification: OTP sent to email={}", email));
                })
                .doOnError(error -> logger.error("Failed to send OTP to email: {}", error.getMessage()));
    }

    public Mono<Void> verifyOtpAndActivate(String email, String otp) {
        return cacheUtils.get(OTP_CACHE_KEY, email)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.OTP_EXPIRED_NOT_FOUND)))
                .flatMap(cachedData -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> cacheMap = (Map<String, Object>) cachedData;
                    String cachedOtp = (String) cacheMap.get(OTP_CACHE_OTP_FIELD);
                    Integer userId = ((Number) cacheMap.get(OTP_CACHE_USER_ID_FIELD)).intValue();

                    if (!cachedOtp.equals(otp)) {
                        logger.warn("Invalid OTP provided for email: {}", email);
                        return Mono.error(new ApplicationException(ErrorCode.INVALID_OTP));
                    }

                    logger.info("OTP verified for email: {}", email);

                    return authRepository.activateUserById(userId)
                            .then(cacheUtils.evict(OTP_CACHE_KEY, email));
                })
                .doOnSuccess(v -> logger.info("verifyOtpAndActivate: email={} activated", email))
                .doOnError(error -> logger.error("OTP verification failed for email: {}", error.getMessage()));
    }

    public Mono<Void> requestChangeEmailOtpOld(Integer userId) {
        return authRepository.findById(userId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND)))
                .flatMap(user -> {
                    String email = user.getEmail();
                    String otp = String.format("%0" + OTP_LENGTH + "d", secureRandom.nextInt(OTP_MAX_VALUE));
                    Map<String, Object> cacheData = new HashMap<>();
                    cacheData.put(OTP_CACHE_OTP_FIELD, otp);
                    cacheData.put(OTP_CACHE_USER_ID_FIELD, user.getId());
                    
                    return cacheUtils.putWithTtl("change_email_old", email, cacheData, OTP_TTL)
                            .then(Mono.defer(() -> {
                                Map<String, Object> variables = new HashMap<>();
                                variables.put(OTP_CACHE_OTP_FIELD, otp);
                                variables.put("email", email);
                                return emailService.sendHtmlEmail(email, OTP_EMAIL_SUBJECT, OTP_EMAIL_TEMPLATE, variables);
                            }))
                            .doOnSuccess(v -> logger.info("requestChangeEmailOtpOld: OTP sent to old email={}", email));
                });
    }

    public Mono<Void> verifyChangeEmailOtpOld(Integer userId, String otp) {
        return authRepository.findById(userId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND)))
                .flatMap(user -> cacheUtils.get("change_email_old", user.getEmail())
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.OTP_EXPIRED_NOT_FOUND)))
                        .flatMap(cachedData -> {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> cacheMap = (Map<String, Object>) cachedData;
                            String cachedOtp = (String) cacheMap.get(OTP_CACHE_OTP_FIELD);
                            if (!cachedOtp.equals(otp)) {
                                return Mono.error(new ApplicationException(ErrorCode.INVALID_OTP));
                            }
                            return cacheUtils.putWithTtl("change_email_verified", String.valueOf(userId), "true", Duration.ofMinutes(15))
                                    .then(cacheUtils.evict("change_email_old", user.getEmail()))
                                    .doOnSuccess(v -> logger.info("verifyChangeEmailOtpOld: Old email verified for user={}", userId));
                        }));
    }

    public Mono<Void> requestChangeEmailOtpNew(Integer userId, String newEmail) {
        return authRepository.existsByEmail(newEmail)
            .flatMap(exists -> {
                if (exists) return Mono.error(new ApplicationException(ErrorCode.EMAIL_ALREADY_EXISTS));
                return cacheUtils.get("change_email_verified", String.valueOf(userId))
                    .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORBIDDEN)))
                    .flatMap(verified -> {
                        String otp = String.format("%0" + OTP_LENGTH + "d", secureRandom.nextInt(OTP_MAX_VALUE));
                        Map<String, Object> cacheData = new HashMap<>();
                        cacheData.put(OTP_CACHE_OTP_FIELD, otp);
                        cacheData.put(OTP_CACHE_USER_ID_FIELD, userId);
                        cacheData.put("newEmail", newEmail);
                        
                        return cacheUtils.putWithTtl("change_email_new", String.valueOf(userId), cacheData, OTP_TTL)
                                .then(Mono.defer(() -> {
                                    Map<String, Object> variables = new HashMap<>();
                                    variables.put(OTP_CACHE_OTP_FIELD, otp);
                                    variables.put("email", newEmail);
                                    return emailService.sendHtmlEmail(newEmail, OTP_EMAIL_SUBJECT, OTP_EMAIL_TEMPLATE, variables);
                                }))
                                .doOnSuccess(v -> logger.info("requestChangeEmailOtpNew: OTP sent to new email={}", newEmail));
                    });
            });
    }

    public Mono<Void> verifyChangeEmailOtpNew(Integer userId, String newEmail, String otp) {
        return cacheUtils.get("change_email_new", String.valueOf(userId))
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.OTP_EXPIRED_NOT_FOUND)))
                .flatMap(cachedData -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> cacheMap = (Map<String, Object>) cachedData;
                    String cachedOtp = (String) cacheMap.get(OTP_CACHE_OTP_FIELD);
                    String cachedNewEmail = (String) cacheMap.get("newEmail");
                    if (!cachedOtp.equals(otp)) {
                        return Mono.error(new ApplicationException(ErrorCode.INVALID_OTP));
                    }
                    if (!cachedNewEmail.equals(newEmail)) {
                        return Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST));
                    }
                    return authRepository.existsByEmail(newEmail)
                        .flatMap(exists -> {
                            if (exists) return Mono.error(new ApplicationException(ErrorCode.EMAIL_ALREADY_EXISTS));
                            return authRepository.updateEmailById(userId, newEmail)
                                    .then(cacheUtils.evict("change_email_new", String.valueOf(userId)))
                                    .then(cacheUtils.evict("change_email_verified", String.valueOf(userId)))
                                    .doOnSuccess(v -> {
                                        logger.info("verifyChangeEmailOtpNew: Email updated successfully for user={}", userId);
                                        notificationService.createNotificationAsync(
                                                userId,
                                                "Đổi email thành công",
                                                "Địa chỉ email của bạn đã được cập nhật thành " + newEmail
                                        );
                                    });
                        });
                });
    }

    public Mono<LoginResponse> refreshAccessToken(String refreshToken) {
        if (!StringUtils.hasText(refreshToken)) {
            return Mono.error(new ApplicationException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));
        }

        return Mono.fromCallable(() -> {
            com.nimbusds.jwt.JWTClaimsSet claims = jwtUtils.validateToken(refreshToken);
            Integer userId = Integer.valueOf(claims.getSubject());
            Object orgIdClaim = claims.getClaim("organizationId");
            Integer orgId = orgIdClaim instanceof Number ? ((Number) orgIdClaim).intValue() : null;
            return new AbstractMap.SimpleEntry<>(userId, orgId);
        })
                .onErrorMap(e -> new ApplicationException(ErrorCode.INVALID_REFRESH_TOKEN, e))
                .flatMap(entry -> {
                    Integer userId = entry.getKey();
                    Integer organizationIdFromRefresh = entry.getValue();

                    return authRepository.findById(userId)
                            .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND)))
                            .flatMap(user -> {
                                Mono<Integer> orgMono = organizationIdFromRefresh != null
                                        ? Mono.just(organizationIdFromRefresh)
                                        : authRepository.getOrganizationIdByUserId(userId).next();

                                return orgMono.defaultIfEmpty(-1)
                                        .flatMap(orgId -> {
                                            Integer finalOrgId = (orgId == -1) ? null : orgId;
                                            String newAccessToken = jwtUtils.generateAccessToken(
                                                    user.getId(),
                                                    user.getEmail(),
                                                    user.getRole().name(),
                                                    user.getAvatarUrl(),
                                                    finalOrgId
                                            );

                                            if (finalOrgId == null) {
                                                return Mono.just(LoginResponse.builder()
                                                        .accessToken(newAccessToken)
                                                        .verificationLevel(1) // Admin level
                                                        .build());
                                            }

                                            return getVerificationLevel(user.getId(), finalOrgId)
                                                    .defaultIfEmpty(0)
                                                    .map(level -> LoginResponse.builder()
                                                            .accessToken(newAccessToken)
                                                            .verificationLevel(level)
                                                            .build());
                                        });
                            })
                            .doOnSuccess(res -> logger.info("refreshAccessToken: userId={} token refreshed", userId));
                });
    }

    private Mono<GoogleTokenInfo> verifyGoogleToken(String idToken) {
        return googleApiClient.get()
                .uri(uriBuilder -> uriBuilder.path(GOOGLE_TOKEN_INFO_PATH)
                        .queryParam("id_token", idToken)
                        .build())
                .retrieve()
                .onStatus(HttpStatusCode::isError, response ->
                        response.bodyToMono(String.class)
                                .defaultIfEmpty("Google token validation failed")
                                .flatMap(body -> Mono.error(new ApplicationException(ErrorCode.GOOGLE_TOKEN_INVALID))))
                .bodyToMono(GoogleTokenInfo.class)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.GOOGLE_TOKEN_INVALID)))
                .flatMap(this::validateGoogleTokenInfo);
    }

    private Mono<GoogleTokenInfo> validateGoogleTokenInfo(GoogleTokenInfo tokenInfo) {
        if (tokenInfo == null) {
            return Mono.error(new ApplicationException(ErrorCode.GOOGLE_TOKEN_INVALID));
        }
        if (!StringUtils.hasText(tokenInfo.aud()) || !googleClientId.equals(tokenInfo.aud())) {
            return Mono.error(new ApplicationException(ErrorCode.GOOGLE_TOKEN_AUDIENCE_INVALID));
        }
        if (!StringUtils.hasText(tokenInfo.iss())
                || (!GOOGLE_ISSUER.equals(tokenInfo.iss()) && !GOOGLE_ISSUER_HTTPS.equals(tokenInfo.iss()))) {
            return Mono.error(new ApplicationException(ErrorCode.GOOGLE_TOKEN_ISSUER_INVALID));
        }
        if (!"true".equalsIgnoreCase(tokenInfo.emailVerified())) {
            return Mono.error(new ApplicationException(ErrorCode.GOOGLE_EMAIL_NOT_VERIFIED));
        }
        if (!StringUtils.hasText(tokenInfo.email())) {
            return Mono.error(new ApplicationException(ErrorCode.GOOGLE_ACCOUNT_EMAIL_MISSING));
        }
        return Mono.just(tokenInfo);
    }

    private Mono<User> loginExistingGoogleUser(User user, String pictureUrl, Integer organizationId, String userAgent, String loginIp) {
        if (user.getStatus() == Status.BANNED
            || user.getStatus() == Status.SUSPENDED
            || user.getStatus() == Status.DELETED
            || user.getStatus() == Status.DISABLED) {
            return Mono.error(new ApplicationException(ErrorCode.GOOGLE_LOGIN_NOT_ALLOWED));
        }

        Mono<Void> activateIfNeeded = user.getStatus() == Status.ACTIVE
                ? Mono.empty()
                : authRepository.activateUserById(user.getId());

        Mono<Void> updateAvatarIfNeeded = (!StringUtils.hasText(user.getAvatarUrl()) && StringUtils.hasText(pictureUrl))
                ? authRepository.updateAvatarById(user.getId(), pictureUrl)
                : Mono.empty();

        Mono<Void> ensureOrgMembership = ensureOrganizationMembership(user.getId(), organizationId);

        return activateIfNeeded
                .then(updateAvatarIfNeeded)
                .then(ensureOrgMembership)
                .then(authRepository.findById(user.getId()))
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND)))
                .doOnNext(existing -> recordLoginSuccessAsync(existing.getId(), GOOGLE_LOGIN_METHOD, userAgent, loginIp));
    }

    private Mono<User> registerGoogleUser(GoogleTokenInfo tokenInfo, Integer organizationId, String userAgent, String loginIp) {
        String fullName = StringUtils.hasText(tokenInfo.name())
                ? tokenInfo.name().trim()
                : tokenInfo.email();

        return Mono.fromCallable(() -> passwordEncoder.encode(UUID.randomUUID().toString()))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(passwordHash -> authRepository.registerGoogleUser(
                                tokenInfo.email(),
                                passwordHash,
                                tokenInfo.picture())
                        .flatMap(userId -> authRepository.createGlobalProfile(userId, fullName)
                                .then(authRepository.createOrganizationMember(organizationId, userId, null))
                                .thenReturn(userId))
                        .flatMap(authRepository::findById)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND))))
                .doOnNext(u -> recordLoginSuccessAsync(u.getId(), GOOGLE_LOGIN_METHOD, userAgent, loginIp));
    }



    private Mono<Void> ensureOrganizationMembership(Integer userId, Integer organizationId) {
        return authRepository.existsOrganizationMemberByUserIdAndOrgId(userId, organizationId)
                .flatMap(isMember -> {
                    if (Boolean.TRUE.equals(isMember)) {
                        return Mono.empty();
                    }
                    return authRepository.createOrganizationMember(organizationId, userId, null)
                            .doOnError(error -> logger.error("Failed to create organization membership for user id: {} in organization: {}: {}", userId, organizationId, error.getMessage()));
                });
    }



    private void recordLoginSuccessAsync(Integer userId, String loginMethod, String userAgent, String loginIp) {
        UserLoginHistory history = UserLoginHistory.builder()
            .userId(userId)
            .loginMethod(loginMethod)
            .userAgent(userAgent)
            .loginIp(loginIp)
            .build();

        userLoginHistoryRepository.save(history)
            .then()
            .onErrorResume(error -> {
                logger.warn("Failed to save login history for user id: {}", userId, error);
                return Mono.empty();
            })
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe();
    }

    private record GoogleTokenInfo(
            String aud,
            String iss,
            String email,
            @JsonProperty("email_verified")
            String emailVerified,
            String name,
            String picture) {
    }
}
