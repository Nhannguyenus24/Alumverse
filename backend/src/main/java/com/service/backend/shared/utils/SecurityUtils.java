package com.service.backend.shared.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import reactor.core.publisher.Mono;

/**
 * Utility class for security-related operations in reactive WebFlux context.
 * Principal is set as String.valueOf(userId) in SecurityConfig's authentication filter.
 * Authorities are set as "ROLE_{role}".
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    private static Mono<Authentication> getAuthentication() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .filter(auth -> auth != null && auth.isAuthenticated());
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
                    return Mono.empty();
                });
    }

    public static Mono<String> getCurrentUserRole() {
        return getAuthentication()
                .flatMap(auth -> auth.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .filter(a -> a.startsWith("ROLE_"))
                        .map(a -> a.substring(5))
                        .findFirst()
                        .map(Mono::just)
                        .orElse(Mono.empty()));
    }

    public static Mono<Boolean> hasRole(String role) {
        return getCurrentUserRole()
                .map(currentRole -> currentRole.equalsIgnoreCase(role))
                .onErrorReturn(false);
    }

    /**
     * Resolves the effective organizationId for the current user.
     * STAFF: always returns their own organizationId from the JWT (ignores requestedOrgId).
     * ADMIN: returns Mono.just(requestedOrgId) if non-null, else Mono.empty() (meaning "all orgs").
     */
    public static Mono<Integer> resolveOrganizationId(Integer requestedOrgId) {
        return getCurrentUserRole()
                .flatMap(role -> {
                    if ("STAFF".equals(role)) {
                        return getCurrentOrganizationId();
                    }
                    return requestedOrgId != null ? Mono.just(requestedOrgId) : Mono.empty();
                });
    }
}
