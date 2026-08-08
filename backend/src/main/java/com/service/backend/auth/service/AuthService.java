package com.service.backend.auth.service;

import com.nimbusds.jwt.JWTClaimsSet;
import com.service.backend.shared.utils.CacheNames;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Collections;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import com.service.backend.shared.exception.ApplicationException;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

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
import com.service.backend.shared.enums.UserRole;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import com.service.backend.user.service.NotificationService;
import reactor.util.function.Tuple2;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final Duration OTP_TTL = Duration.ofMinutes(5);
    private static final String GOOGLE_LOGIN_METHOD = "GOOGLE";
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
    private final String googleClientId;
    private final SecureRandom secureRandom;
    private final NotificationService notificationService;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;
    private final MeterRegistry meterRegistry;

    public AuthService(AuthRepository authRepository, PasswordEncoder passwordEncoder,
                      EmailService emailService, CacheUtils cacheUtils,
                      JwtUtils jwtUtils,
                      UserLoginHistoryRepository userLoginHistoryRepository,
                      @Value("${google.oauth.client-id:}") String googleClientId,
                      NotificationService notificationService,
                      MeterRegistry meterRegistry) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.cacheUtils = cacheUtils;
        this.jwtUtils = jwtUtils;
        this.userLoginHistoryRepository = userLoginHistoryRepository;
        this.googleClientId = googleClientId == null ? "" : googleClientId.trim();
        this.secureRandom = new SecureRandom();
        this.notificationService = notificationService;
        this.meterRegistry = meterRegistry;
        this.googleIdTokenVerifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(this.googleClientId))
                .build();
    }

    @Transactional
    public Mono<Void> register(String email, String password, String fullName, Integer organizationId) {
        return Mono.fromCallable(() -> passwordEncoder.encode(password))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(hashedPassword ->
                        authRepository.registerNewUser(email, hashedPassword, fullName)
                                .flatMap(userId -> authRepository.createOrganizationMember(organizationId, userId))
                )
                .onErrorResume(DataIntegrityViolationException.class, e -> {
                    logger.warn("Registration failed - email already exists: {}", email);
                    return Mono.error(new ApplicationException(ErrorCode.EMAIL_ALREADY_EXISTS));
                })
                .doOnError(e -> logger.error("Registration failed: {}", e.getMessage()));
    }

    public Mono<User> loginByEmail(String email, String password, Integer organizationId, String userAgent, String loginIp) {
        return authRepository.findByEmail(email)
                .flatMap(user -> Mono.fromCallable(() -> passwordEncoder.matches(password, user.getPasswordHash()))
                        .subscribeOn(Schedulers.boundedElastic())
                        .flatMap(isMatch -> {
                            if (!isMatch) {
                                logger.warn("Login failed - invalid password for email: {}", email);
                                return Mono.error(new ApplicationException(ErrorCode.INVALID_CREDENTIALS));
                            }

                            if (user.getStatus() != Status.ACTIVE) {
                                logger.warn("Login failed - account not active for email: {}. Status: {}", email, user.getStatus());
                                return Mono.error(new ApplicationException(ErrorCode.ACCOUNT_NOT_VERIFIED));
                            }

                            // Membership is not required to log in. Non-members are allowed in as
                            // guests and simply receive verificationLevel 0 for the organization
                            // (resolved by the caller via getVerificationLevel + defaultIfEmpty(0)).
                            if (organizationId != null) {
                                return authRepository.existsOrganizationMemberByUserIdAndOrgId(user.getId(), organizationId)
                                        .doOnNext(isMember -> {
                                            if (Boolean.FALSE.equals(isMember)) {
                                                logger.info("Login as GUEST - user {} is not a member of organization {} (verificationLevel=0)", email, organizationId);
                                            }
                                        })
                                        .thenReturn(user)
                                        .doOnSuccess(u -> recordLoginSuccessAsync(u.getId(), "EMAIL", userAgent, loginIp));
                            } else {
                                recordLoginSuccessAsync(user.getId(), "EMAIL", userAgent, loginIp);
                                return Mono.just(user);
                            }
                        }))
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND)))
                .doOnSuccess(u -> {
                    recordLoginMetric("EMAIL", "success");
                    logger.debug("loginByEmail result: {}", JsonUtils.toJson(u));
                })
                .doOnError(error -> {
                    recordLoginMetric("EMAIL", "failure");
                    logger.error("Login error for email: {} - {}", email, error.getMessage());
                });
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
                .doOnSuccess(u -> {
                    recordLoginMetric("GOOGLE", "success");
                    logger.debug("loginWithGoogle result: {}", JsonUtils.toJson(u));
                })
                .doOnError(error -> {
                    recordLoginMetric("GOOGLE", "failure");
                    logger.error("Google login failed: {}", error.getMessage());
                });
    }

    public Mono<Void> activateUser(Integer userId) {
        return authRepository.activateUserById(userId)
                .doOnSuccess(v -> logger.info("activateUser: userId={} activated", userId))
                .doOnError(error -> logger.error("Failed to activate user with id: {}", error.getMessage()));
    }

    public Mono<Void> resetPasswordWithOtp(String email, String otp, String newPassword) {
        return cacheUtils.get(CacheNames.OTP_VERIFICATION, email)
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
                            .then(cacheUtils.evict(CacheNames.OTP_VERIFICATION, email));
                })
                .doOnSuccess(v -> logger.info("resetPasswordWithOtp: password reset for email={}", email))
                .doOnError(error -> logger.error("Password reset failed for email: {}", error.getMessage()));
    }

    public Mono<Void> changePassword(Integer userId, String oldPassword, String newPassword) {
        return authRepository.findById(userId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND)))
                .flatMap(user -> Mono.fromCallable(() -> passwordEncoder.matches(oldPassword, user.getPasswordHash()))
                        .subscribeOn(Schedulers.boundedElastic())
                        .flatMap(isMatch -> {
                            if (!isMatch) {
                                logger.warn("Password change failed - invalid old password for user id: {}", userId);
                                return Mono.error(new ApplicationException(ErrorCode.INVALID_OLD_PASSWORD));
                            }

                            return Mono.fromCallable(() -> passwordEncoder.encode(newPassword))
                                    .subscribeOn(Schedulers.boundedElastic())
                                    .flatMap(hashedPassword -> authRepository.updatePasswordById(userId, hashedPassword))
                                    .doOnSuccess(v -> logger.info("changePassword: userId={} password changed", userId));
                        }))
                .doOnError(error -> logger.error("Password change error for user id: {}", error.getMessage()));
    }

    public Mono<Integer> getVerificationLevel(Integer userId, Integer organizationId) {
        return authRepository.getVerificationLevelByUserIdAndOrgId(userId, organizationId);
    }

    public Mono<Integer> getEffectiveVerificationLevel(User user, Integer organizationId) {
        if (user.getRole() == UserRole.ADMIN) {
            return Mono.just(4);
        }
        if (organizationId == null) {
            return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Organization ID is required for non-admin users"));
        }
        if (user.getRole() == UserRole.STAFF) {
            return authRepository.existsOrganizationMemberByUserIdAndOrgId(user.getId(), organizationId)
                    .map(isMember -> Boolean.TRUE.equals(isMember) ? 4 : 2);
        }
        return getVerificationLevel(user.getId(), organizationId).defaultIfEmpty(0);
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

                    return cacheUtils.putWithTtl(CacheNames.OTP_VERIFICATION, email, cacheData, OTP_TTL)
                            .then(Mono.defer(() -> {
                                Map<String, Object> variables = new HashMap<>();
                                variables.put(OTP_CACHE_OTP_FIELD, otp);
                                variables.put("email", email);

                                return emailService.sendHtmlEmail(
                                        email,
                                        OTP_EMAIL_SUBJECT,
                                        OTP_EMAIL_TEMPLATE,
                                        variables
                                ).onErrorMap(error -> {
                                    logger.error("Failed to deliver OTP to email={}: {}", email, error.getMessage(), error);
                                    return new ApplicationException(ErrorCode.OTP_DELIVERY_FAILED, error);
                                });
                            }))
                            .doOnSuccess(v -> logger.info("sendOtpVerification: OTP sent to email={}", email));
                })
                .doOnError(error -> logger.error("Failed to send OTP to email: {}", error.getMessage()));
    }

    public Mono<Void> verifyOtpAndActivate(String email, String otp) {
        return cacheUtils.get(CacheNames.OTP_VERIFICATION, email)
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
                            .then(cacheUtils.evict(CacheNames.OTP_VERIFICATION, email));
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
                    
                    return cacheUtils.putWithTtl(com.service.backend.shared.utils.CacheNames.CHANGE_EMAIL_OLD, email, cacheData, OTP_TTL)
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
                .flatMap(user -> cacheUtils.get(com.service.backend.shared.utils.CacheNames.CHANGE_EMAIL_OLD, user.getEmail())
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.OTP_EXPIRED_NOT_FOUND)))
                        .flatMap(cachedData -> {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> cacheMap = (Map<String, Object>) cachedData;
                            String cachedOtp = (String) cacheMap.get(OTP_CACHE_OTP_FIELD);
                            if (!cachedOtp.equals(otp)) {
                                return Mono.error(new ApplicationException(ErrorCode.INVALID_OTP));
                            }
                            return cacheUtils.putWithTtl(com.service.backend.shared.utils.CacheNames.CHANGE_EMAIL_VERIFIED, String.valueOf(userId), "true", Duration.ofMinutes(15))
                                    .then(cacheUtils.evict(com.service.backend.shared.utils.CacheNames.CHANGE_EMAIL_OLD, user.getEmail()))
                                    .doOnSuccess(v -> logger.info("verifyChangeEmailOtpOld: Old email verified for user={}", userId));
                        }));
    }

    public Mono<Void> requestChangeEmailOtpNew(Integer userId, String newEmail) {
        return cacheUtils.get(com.service.backend.shared.utils.CacheNames.CHANGE_EMAIL_VERIFIED, String.valueOf(userId))
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORBIDDEN)))
                .flatMap(verified -> {
                    String otp = String.format("%0" + OTP_LENGTH + "d", secureRandom.nextInt(OTP_MAX_VALUE));
                    Map<String, Object> cacheData = new HashMap<>();
                    cacheData.put(OTP_CACHE_OTP_FIELD, otp);
                    cacheData.put(OTP_CACHE_USER_ID_FIELD, userId);
                    cacheData.put("newEmail", newEmail);
                    
                    return cacheUtils.putWithTtl(com.service.backend.shared.utils.CacheNames.CHANGE_EMAIL_NEW, String.valueOf(userId), cacheData, OTP_TTL)
                            .then(Mono.defer(() -> {
                                Map<String, Object> variables = new HashMap<>();
                                variables.put(OTP_CACHE_OTP_FIELD, otp);
                                variables.put("email", newEmail);
                                return emailService.sendHtmlEmail(newEmail, OTP_EMAIL_SUBJECT, OTP_EMAIL_TEMPLATE, variables);
                            }))
                            .doOnSuccess(v -> logger.info("requestChangeEmailOtpNew: OTP sent to new email={}", newEmail));
                });
    }

    public Mono<Void> verifyChangeEmailOtpNew(Integer userId, String newEmail, String otp) {
        return cacheUtils.get(com.service.backend.shared.utils.CacheNames.CHANGE_EMAIL_NEW, String.valueOf(userId))
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
                    return authRepository.updateEmailById(userId, newEmail)
                            .then(cacheUtils.evict(com.service.backend.shared.utils.CacheNames.CHANGE_EMAIL_NEW, String.valueOf(userId)))
                            .then(cacheUtils.evict(com.service.backend.shared.utils.CacheNames.CHANGE_EMAIL_VERIFIED, String.valueOf(userId)))
                            .onErrorResume(DataIntegrityViolationException.class, e -> {
                                logger.warn("Email already exists: {}", newEmail);
                                return Mono.error(new ApplicationException(ErrorCode.EMAIL_ALREADY_EXISTS));
                            })
                            .doOnSuccess(v -> {
                                logger.info("verifyChangeEmailOtpNew: Email updated successfully for user={}", userId);
                                notificationService.createNotificationAsync(
                                        userId,
                                        "Đổi email thành công",
                                        "Địa chỉ email của bạn đã được cập nhật thành " + newEmail
                                );
                            });
                });
    }

    public Mono<LoginResponse> refreshAccessToken(String refreshToken, Integer organizationId) {
        if (!StringUtils.hasText(refreshToken)) {
            return Mono.error(new ApplicationException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));
        }

        return Mono.fromCallable(() -> {
            JWTClaimsSet claims = jwtUtils.validateToken(refreshToken);
            return Integer.valueOf(claims.getSubject());
        })
                .onErrorMap(e -> new ApplicationException(ErrorCode.INVALID_REFRESH_TOKEN, e))
                .flatMap(userId -> authRepository.findById(userId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND)))
                        .flatMap(user -> {
                            // The refresh token no longer carries the organization. The client passes the
                            // organization it is currently viewing so the refreshed access token stays scoped
                            // to it. ADMINs operate without an org ("all orgs") and get the system-admin level.
                            if (user.getRole() == UserRole.ADMIN) {
                                // Must match the login path (AuthController#buildLoginResponse)
                                // so refresh doesn't silently downgrade a system admin.
                                return Mono.just(buildRefreshResponse(user, null, 4));
                            }

                            if (organizationId == null) {
                                return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Organization ID is required for non-admin users"));
                            }

                            return getEffectiveVerificationLevel(user, organizationId)
                                    .map(level -> buildRefreshResponse(user, organizationId, level));
                        }))
                .doOnSuccess(res -> meterRegistry.counter("auth.token.refresh", "result", "success").increment())
                .doOnError(error -> meterRegistry.counter("auth.token.refresh", "result", "failure").increment());
    }

    private void recordLoginMetric(String method, String result) {
        meterRegistry.counter("auth.login", "method", method, "result", result).increment();
    }

    private LoginResponse buildRefreshResponse(User user, Integer organizationId, Integer verificationLevel) {
        return LoginResponse.builder()
                .accessToken(jwtUtils.generateAccessToken(user, organizationId, verificationLevel))
                .verificationLevel(verificationLevel)
                .build();
    }

    public Mono<Tuple2<String, Integer>> switchOrganization(String refreshToken, Integer newOrganizationId) {
        if (!StringUtils.hasText(refreshToken)) {
            return Mono.error(new ApplicationException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));
        }

        return Mono.fromCallable(() -> {
            com.nimbusds.jwt.JWTClaimsSet claims = jwtUtils.validateToken(refreshToken);
            return Integer.valueOf(claims.getSubject());
        })
        .onErrorMap(e -> new ApplicationException(ErrorCode.INVALID_REFRESH_TOKEN, e))
        .flatMap(userId -> authRepository.findById(userId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND)))
                .flatMap(user -> getEffectiveVerificationLevel(user, newOrganizationId)
                        .map(level -> reactor.util.function.Tuples.of(
                                jwtUtils.generateAccessToken(user, newOrganizationId, level),
                                level))
                        .doOnSuccess(tuple -> {
                            Integer level = tuple.getT2();
                            if (level == 0) {
                                logger.info("switchOrganization: userId={} switched to organizationId={} as GUEST (not a member, verificationLevel=0)", userId, newOrganizationId);
                            } else {
                                logger.info("switchOrganization: userId={} switched to organizationId={} as MEMBER (verificationLevel={})", userId, newOrganizationId, level);
                            }
                        })));
    }

    private Mono<GoogleTokenInfo> verifyGoogleToken(String idTokenString) {
        return Mono.fromCallable(() -> {
            GoogleIdToken idToken = googleIdTokenVerifier.verify(idTokenString);
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();

                String email = payload.getEmail();
                boolean emailVerified = Boolean.TRUE.equals(payload.getEmailVerified());
                String name = (String) payload.get("name");
                String pictureUrl = (String) payload.get("picture");

                if (!emailVerified) {
                    throw new ApplicationException(ErrorCode.GOOGLE_EMAIL_NOT_VERIFIED);
                }
                if (!StringUtils.hasText(email)) {
                    throw new ApplicationException(ErrorCode.GOOGLE_ACCOUNT_EMAIL_MISSING);
                }

                return new GoogleTokenInfo(
                        Collections.singletonList(this.googleClientId).toString(),
                        payload.getIssuer(),
                        email,
                        "true",
                        name,
                        pictureUrl
                );
            } else {
                throw new ApplicationException(ErrorCode.GOOGLE_TOKEN_INVALID);
            }
        })
        .subscribeOn(Schedulers.boundedElastic())
        .onErrorMap(e -> {
            if (e instanceof ApplicationException) {
                return e;
            }
            return new ApplicationException(ErrorCode.GOOGLE_TOKEN_INVALID, e);
        });
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

        return Mono.when(activateIfNeeded, updateAvatarIfNeeded, ensureOrgMembership)
                .then(Mono.defer(() -> {
                    if (user.getStatus() != Status.ACTIVE) {
                        user.setStatus(Status.ACTIVE);
                    }
                    if (!StringUtils.hasText(user.getAvatarUrl()) && StringUtils.hasText(pictureUrl)) {
                        user.setAvatarUrl(pictureUrl);
                    }
                    return Mono.just(user);
                }))
                .doOnNext(existing -> recordLoginSuccessAsync(existing.getId(), GOOGLE_LOGIN_METHOD, userAgent, loginIp));
    }

    private Mono<User> registerGoogleUser(GoogleTokenInfo tokenInfo, Integer organizationId, String userAgent, String loginIp) {
        String fullName = StringUtils.hasText(tokenInfo.name())
                ? tokenInfo.name().trim()
                : tokenInfo.email();

        return authRepository.registerGoogleUser(
                        tokenInfo.email(),
                        null,
                        tokenInfo.picture(), 
                        fullName)
                .flatMap(user -> authRepository.createOrganizationMember(organizationId, user.getId())
                        .thenReturn(user))
                .doOnNext(user -> recordLoginSuccessAsync(user.getId(), GOOGLE_LOGIN_METHOD, userAgent, loginIp));
    }



    private Mono<Void> ensureOrganizationMembership(Integer userId, Integer organizationId) {
        return authRepository.existsOrganizationMemberByUserIdAndOrgId(userId, organizationId)
                .flatMap(isMember -> {
                    if (Boolean.TRUE.equals(isMember)) {
                        return Mono.empty();
                    }
                    return authRepository.createOrganizationMember(organizationId, userId)
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
