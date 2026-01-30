package com.service.backend.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.service.backend.auth.entity.User;
import com.service.backend.auth.repository.AuthRepository;

import reactor.core.publisher.Mono;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
        
    public AuthService(AuthRepository authRepository, PasswordEncoder passwordEncoder) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Mono<User> register(String email, String userName, String password) {
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
                    return authRepository.registerNewUser(email, userName, hashedPassword);
                })
                .then(authRepository.findByEmail(email))
                .doOnSuccess(user -> logger.info("User registered successfully: {}", email))
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
                .flatMap(user -> {
                    if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
                        logger.warn("Password change failed - invalid old password for user id: {}", userId);
                        return Mono.error(new RuntimeException("Invalid old password"));
                    }

                    String hashedPassword = passwordEncoder.encode(newPassword);
                    return authRepository.updatePasswordById(userId, hashedPassword)
                            .doOnSuccess(v -> logger.info("Password changed successfully for user id: {}", userId));
                })
                .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                .doOnError(error -> logger.error("Password change error for user id: {}", userId, error));
    }
}
