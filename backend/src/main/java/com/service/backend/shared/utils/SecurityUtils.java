package com.service.backend.shared.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import reactor.core.publisher.Mono;

/**
 * Utility class for security-related operations in reactive WebFlux context.
 * Principal is set as String.valueOf(userId) in HeaderAuthenticationFilter.
 * Authorities are set as "ROLE_{role}".
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    private static Mono<Authentication> getAuthentication() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .switchIfEmpty(Mono.error(new RuntimeException("User not authenticated")));
    }

    public static Mono<Long> getCurrentUserId() {
        return getAuthentication()
                .map(auth -> Long.parseLong((String) auth.getPrincipal()));
    }

    public static Mono<Integer> getCurrentOrganizationId() {
        return getAuthentication()
                .flatMap(auth -> {
                    Object details = auth.getDetails();
                    if (details instanceof Integer orgId) {
                        return Mono.just(orgId);
                    }
                    return Mono.error(new RuntimeException("No organization id in authentication context"));
                });
    }

    public static Mono<String> getCurrentUserRole() {
        return getAuthentication()
                .map(auth -> auth.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .filter(a -> a.startsWith("ROLE_"))
                        .map(a -> a.substring(5))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("No role found")));
    }

    public static Mono<Boolean> hasRole(String role) {
        return getCurrentUserRole()
                .map(currentRole -> currentRole.equalsIgnoreCase(role))
                .onErrorReturn(false);
    }
}
