package com.service.backend.auth.service;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service to track login attempts and implement account lockout mechanism.
 * Prevents brute force attacks by locking accounts after N failed attempts.
 */
@Service
@Slf4j
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

    // In-memory store of login attempts keyed by email
    private final Map<String, LoginAttempt> loginAttempts = new ConcurrentHashMap<>();

    /**
     * Record successful login - reset attempt counter
     */
    public void recordSuccessfulLogin(String email) {
        if (email != null) {
            loginAttempts.remove(email);
            log.debug("Login successful for email: {}", maskEmail(email));
        }
    }

    /**
     * Record failed login attempt - increment counter and lock if exceeded
     */
    public void recordFailedLogin(String email) {
        if (email == null) {
            return;
        }

        LoginAttempt attempt = loginAttempts.getOrDefault(
            email,
            new LoginAttempt(email)
        );

        attempt.incrementAttempts();
        attempt.setLastAttempt(System.currentTimeMillis());

        if (attempt.getAttempts() >= MAX_ATTEMPTS) {
            attempt.setLockedUntil(System.currentTimeMillis() + LOCK_DURATION_MS);
            log.warn("Account locked due to too many failed login attempts: {}", maskEmail(email));
        }

        loginAttempts.put(email, attempt);
    }

    /**
     * Check if account is currently locked
     */
    public boolean isAccountLocked(String email) {
        if (email == null) {
            return false;
        }

        LoginAttempt attempt = loginAttempts.get(email);

        if (attempt == null) {
            return false;
        }

        // Check if lock period has expired
        if (attempt.isLocked()) {
            if (System.currentTimeMillis() > attempt.getLockedUntil()) {
                // Lock expired, remove entry
                loginAttempts.remove(email);
                log.debug("Account lock expired for email: {}", maskEmail(email));
                return false;
            }
            return true;
        }

        return false;
    }

    /**
     * Get remaining lock time in seconds
     */
    public long getRemainingLockTimeSeconds(String email) {
        if (email == null) {
            return 0;
        }

        LoginAttempt attempt = loginAttempts.get(email);

        if (attempt == null || !attempt.isLocked()) {
            return 0;
        }

        long remaining = attempt.getLockedUntil() - System.currentTimeMillis();
        return Math.max(0, remaining / 1000);
    }

    /**
     * Get current number of failed attempts for an email
     */
    public int getFailedAttempts(String email) {
        if (email == null) {
            return 0;
        }

        LoginAttempt attempt = loginAttempts.get(email);
        return attempt != null ? attempt.getAttempts() : 0;
    }

    /**
     * Cleanup expired locks periodically (every minute)
     * Prevents unbounded memory growth
     */
    @Scheduled(fixedDelay = 60_000)
    public void cleanupExpiredLocks() {
        long now = System.currentTimeMillis();
        int removedCount = 0;

        for (String email : loginAttempts.keySet()) {
            LoginAttempt attempt = loginAttempts.get(email);
            if (attempt != null && attempt.getLockedUntil() > 0 && attempt.getLockedUntil() < now) {
                loginAttempts.remove(email);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            log.debug("Cleaned up {} expired account locks", removedCount);
        }
    }

    /**
     * Unlock account manually (admin operation)
     */
    public void unlockAccount(String email) {
        if (email != null) {
            loginAttempts.remove(email);
            log.info("Account unlocked manually for email: {}", maskEmail(email));
        }
    }

    /**
     * Mask email for logging purposes (security)
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        int atIndex = email.indexOf("@");
        if (atIndex <= 1) {
            return "***@***";
        }
        return email.charAt(0) + "***" + email.substring(atIndex);
    }

    /**
     * Inner class to track login attempts
     */
    @Data
    private static class LoginAttempt {
        private final String email;
        private int attempts = 0;
        private long lockedUntil = 0;
        private long lastAttempt = 0;

        public LoginAttempt(String email) {
            this.email = email;
            this.lastAttempt = System.currentTimeMillis();
        }

        public void incrementAttempts() {
            this.attempts++;
        }

        public boolean isLocked() {
            return lockedUntil > System.currentTimeMillis();
        }
    }
}
