package com.service.backend.auth.service;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.service.backend.auth.entity.User;
import com.service.backend.auth.repository.AuthRepository;
import com.service.backend.shared.service.EmailService;
import com.service.backend.shared.utils.CacheUtils;

import reactor.core.publisher.Mono;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final String OTP_CACHE_NAME = "otp_verification";
    private static final Duration OTP_TTL = Duration.ofMinutes(5);
    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final CacheUtils cacheUtils;
    private final com.service.backend.shared.utils.JwtUtils jwtUtils;
    private final Random random;
        
    public AuthService(AuthRepository authRepository, PasswordEncoder passwordEncoder, 
                      EmailService emailService, CacheUtils cacheUtils,
                      com.service.backend.shared.utils.JwtUtils jwtUtils) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.cacheUtils = cacheUtils;
        this.jwtUtils = jwtUtils;
        this.random = new Random();
    }

    public Mono<Void> register(String email, String userName, String password) {
        logger.info("Registering new user with email: {} and username: {}", email, userName);

        Mono<Boolean> emailCheck = authRepository.existsByEmail(email);
        Mono<Boolean> userCheck = authRepository.existsByUserName(userName);

        return Mono.zip(emailCheck, userCheck)
                .flatMap(tuple -> {
                    boolean emailExists = tuple.getT1();
                    boolean usernameExists = tuple.getT2();

                    if (emailExists) return Mono.error(new RuntimeException("Email already registered"));
                    if (usernameExists) return Mono.error(new RuntimeException("Username already exists"));

                    String hashedPassword = passwordEncoder.encode(password);
                    return authRepository.registerNewUser(email, userName, hashedPassword)
                            .doOnSuccess(user -> logger.info("User registered successfully: {}", email));
                })
                .doOnError(e -> logger.error("Registration failed: {}", email, e));
    }

    public Mono<User> loginByEmail(String email, String password) {
        logger.info("Attempting login with email: {}", email);

        return authRepository.findByEmail(email)
                .flatMap(user -> {
                    if (passwordEncoder.matches(password, user.getPasswordHash())) {
                        logger.info("Login successful for email: {}", email);
                        return Mono.just(user);
                    }

                    logger.warn("Login failed - invalid password for email: {}", email);
                    return Mono.error(new RuntimeException("Invalid email or password"));
                })
                .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                .doOnError(error -> logger.error("Login error for email: {}", email, error));
    }

    public Mono<User> loginByUserName(String userName, String password) {
        logger.info("Attempting login with username: {}", userName);

        return authRepository.findByUserName(userName)
                .flatMap(user -> {
                    if (passwordEncoder.matches(password, user.getPasswordHash())) {
                        logger.info("Login successful for username: {}", userName);
                        return Mono.just(user);
                    }

                    logger.warn("Login failed - invalid password for username: {}", userName);
                    return Mono.error(new RuntimeException("Invalid username or password"));
                })
                .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                .doOnError(error -> logger.error("Login error for username: {}", userName, error));
    }

    public Mono<Void> activateUser(Integer userId) {
        logger.info("Activating user with id: {}", userId);
        
        return authRepository.activateUserById(userId)
                .doOnSuccess(v -> logger.info("User activated successfully with id: {}", userId))
                .doOnError(error -> logger.error("Failed to activate user with id: {}", userId, error));
    }

    public Mono<Void> changePassword(Integer userId, String oldPassword, String newPassword) {
        logger.info("Changing password for user id: {}", userId);

        return authRepository.findById(userId)
                .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                .flatMap(user -> {
                    if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
                        logger.warn("Password change failed - invalid old password for user id: {}", userId);
                        return Mono.error(new RuntimeException("Invalid old password"));
                    }

                    String hashedPassword = passwordEncoder.encode(newPassword);
                    return authRepository.updatePasswordById(userId, hashedPassword)
                            .doOnSuccess(v -> logger.info("Password changed successfully for user id: {}", userId));
                })
                .doOnError(error -> logger.error("Password change error for user id: {}", userId, error));
    }

    public Mono<Void> sendOtpVerification(String email) {
        logger.info("Sending OTP verification to email: {}", email);

        return authRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                .flatMap(user -> {
                    // Generate random 6-digit OTP
                    String otp = String.format("%06d", random.nextInt(1000000));
                    logger.info("Generated OTP for email: {}", email);

                    // Cache OTP and userId with TTL
                    Map<String, Object> cacheData = new HashMap<>();
                    cacheData.put("otp", otp);
                    cacheData.put("userId", user.getId());

                    return cacheUtils.putWithTtl(OTP_CACHE_NAME, email, cacheData, OTP_TTL)
                            .then(Mono.defer(() -> {
                                // Send OTP via email
                                Map<String, Object> variables = new HashMap<>();
                                variables.put("otp", otp);
                                variables.put("email", email);

                                return emailService.sendHtmlEmail(
                                        email,
                                        "Email Verification - OTP Code",
                                        "otpVerification",
                                        variables
                                );
                            }))
                            .doOnSuccess(v -> logger.info("OTP sent successfully to email: {}", email));
                })
                .doOnError(error -> logger.error("Failed to send OTP to email: {}", email, error));
    }

    public Mono<Void> verifyOtpAndActivate(String email, String otp) {
        logger.info("Verifying OTP for email: {}", email);

        return cacheUtils.get(OTP_CACHE_NAME, email)
                .switchIfEmpty(Mono.error(new RuntimeException("OTP expired or not found")))
                .flatMap(cachedData -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> cacheMap = (Map<String, Object>) cachedData;
                    String cachedOtp = (String) cacheMap.get("otp");
                    Integer userId = ((Number) cacheMap.get("userId")).intValue();

                    if (!cachedOtp.equals(otp)) {
                        logger.warn("Invalid OTP provided for email: {}", email);
                        return Mono.error(new RuntimeException("Invalid OTP"));
                    }

                    logger.info("OTP verified successfully for email: {}", email);

                    return authRepository.activateUserById(userId)
                            .doOnSuccess(v -> logger.info("User account activated for email: {}", email));
                })
                .doOnError(error -> logger.error("OTP verification failed for email: {}", email, error));
    }

    /**
     * Refresh access token using refresh token
     */
    public Mono<String> refreshAccessToken(String refreshToken) {
        logger.info("Refreshing access token");

        if (refreshToken == null || refreshToken.isEmpty()) {
            return Mono.error(new RuntimeException("Refresh token not found"));
        }

        try {
            // Validate refresh token and get user ID
            Integer userId = jwtUtils.getUserIdFromToken(refreshToken);
            
            // Retrieve user information and generate new access token
            return authRepository.findById(userId)
                    .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                    .map(user -> {
                        String accessToken = jwtUtils.generateAccessToken(
                                user.getId(),
                                user.getEmail(),
                                user.getRole().name(),
                                user.getUserName(),
                                user.getAvatarUrl()
                        );
                        logger.info("Access token refreshed successfully for user id: {}", userId);
                        return accessToken;
                    })
                    .doOnError(error -> logger.error("Failed to refresh token for user id: {}", userId, error));
        } catch (Exception e) {
            logger.error("Invalid or expired refresh token", e);
            return Mono.error(new RuntimeException("Invalid or expired refresh token"));
        }
    }
}
