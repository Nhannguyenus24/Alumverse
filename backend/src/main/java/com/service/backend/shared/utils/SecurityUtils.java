package com.service.backend.shared.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import reactor.core.publisher.Mono;

/**
 * Utility class for security-related operations in reactive WebFlux context.
 */
public class SecurityUtils {

    /**
     * Get the current authenticated user ID from the security context.
     * The principal is set as String.valueOf(userId) in HeaderAuthenticationFilter.
     *
     * @return Mono containing the user ID as Long
     * @throws RuntimeException if user is not authenticated
     */
    public static Mono<Long> getCurrentUserId() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(Authentication::getPrincipal)
                .cast(String.class)
                .map(Long::parseLong)
                .switchIfEmpty(Mono.error(new RuntimeException("User not authenticated")));
    }
}
