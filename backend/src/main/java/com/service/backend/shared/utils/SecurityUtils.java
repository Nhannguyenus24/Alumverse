package com.service.backend.shared.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import reactor.core.publisher.Mono;

import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;

/**
 * Utility class for security-related operations in reactive WebFlux context.
 * Principal is set as String.valueOf(userId) in SecurityConfig's authentication filter.
 * Authorities are set as "ROLE_{role}" and optionally "VERIFICATION_LEVEL_{level}".
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

    public static Mono<Integer> getCurrentVerificationLevel() {
        return getAuthentication()
                .flatMap(auth -> {
                    for (GrantedAuthority authority : auth.getAuthorities()) {
                        String value = authority.getAuthority();
                        if (value != null && value.startsWith("VERIFICATION_LEVEL_")) {
                            try {
                                return Mono.just(Integer.parseInt(value.substring("VERIFICATION_LEVEL_".length())));
                            } catch (NumberFormatException ignored) {
                                return Mono.empty();
                            }
                        }
                    }
                    return Mono.empty();
                });
    }

    public static Mono<Boolean> hasRole(String role) {
        return getCurrentUserRole()
                .map(currentRole -> currentRole.equalsIgnoreCase(role))
                .onErrorReturn(false);
    }

    public static Mono<Boolean> canSubmitContributorContent(Integer organizationId) {
        if (organizationId == null) {
            return Mono.just(false);
        }
        return Mono.zip(
                        getCurrentUserRole(),
                        getCurrentVerificationLevel().defaultIfEmpty(0),
                        getCurrentOrganizationId().defaultIfEmpty(-1)
                )
                .map(ctx -> {
                    String role = ctx.getT1();
                    Integer level = ctx.getT2();
                    Integer currentOrgId = ctx.getT3();
                    boolean inCurrentOrganization = organizationId.equals(currentOrgId);
                    if ("ADMIN".equalsIgnoreCase(role)) {
                        return true;
                    }
                    if ("STAFF".equalsIgnoreCase(role)) {
                        return level >= 4 && inCurrentOrganization;
                    }
                    return level >= 2 && inCurrentOrganization;
                })
                .defaultIfEmpty(false)
                .onErrorReturn(false);
    }

    public static Mono<Boolean> canManageContentOrganization(Integer organizationId) {
        if (organizationId == null) {
            return Mono.just(false);
        }
        return Mono.zip(
                        getCurrentUserRole(),
                        getCurrentVerificationLevel().defaultIfEmpty(0),
                        getCurrentOrganizationId().defaultIfEmpty(-1)
                )
                .map(ctx -> {
                    String role = ctx.getT1();
                    Integer level = ctx.getT2();
                    Integer currentOrgId = ctx.getT3();
                    if ("ADMIN".equalsIgnoreCase(role)) {
                        return true;
                    }
                    return "STAFF".equalsIgnoreCase(role)
                            && level >= 4
                            && organizationId.equals(currentOrgId);
                })
                .defaultIfEmpty(false)
                .onErrorReturn(false);
    }

    public static Mono<Boolean> canManageContentOrganization(Long organizationId) {
        return organizationId == null
                ? Mono.just(false)
                : canManageContentOrganization(organizationId.intValue());
    }

    public static Mono<Void> assertCanSubmitContributorContent(Integer organizationId) {
        return canSubmitContributorContent(organizationId)
                .flatMap(allowed -> allowed
                        ? Mono.<Void>empty()
                        : Mono.<Void>error(new ApplicationException(
                                ErrorCode.FORBIDDEN,
                                "You must be verified in the current organization before submitting content")));
    }

    public static Mono<Void> assertCanManageContentOrganization(Integer organizationId) {
        return canManageContentOrganization(organizationId)
                .flatMap(allowed -> allowed
                        ? Mono.<Void>empty()
                        : Mono.<Void>error(new ApplicationException(
                                ErrorCode.FORBIDDEN,
                                "Only admins or organization staff level 4 can manage this content")));
    }

    public static Mono<Void> assertCanManageContentOrganization(Long organizationId) {
        return organizationId == null
                ? Mono.<Void>error(new ApplicationException(
                        ErrorCode.FORBIDDEN,
                        "Only admins or organization staff level 4 can manage this content"))
                : assertCanManageContentOrganization(organizationId.intValue());
    }

    /**
     * Whether the current user may administer the given organization.
     * ADMIN: any organization. STAFF: only their own organization (from the JWT).
     */
    public static Mono<Boolean> canAdministerOrganization(Integer organizationId) {
        if (organizationId == null) {
            return Mono.just(false);
        }
        return Mono.zip(
                        getCurrentUserRole(),
                        getCurrentVerificationLevel().defaultIfEmpty(0),
                        getCurrentOrganizationId().defaultIfEmpty(-1)
                )
                .map(ctx -> {
                    String role = ctx.getT1();
                    Integer level = ctx.getT2();
                    Integer currentOrgId = ctx.getT3();
                    if ("ADMIN".equalsIgnoreCase(role)) {
                        return true;
                    }
                    // STAFF may only administer their OWN org, and must be at ADMIN verification
                    // level (4) — mirrors canManageContentOrganization so a low-level STAFF cannot
                    // reach organization-admin operations.
                    return "STAFF".equalsIgnoreCase(role)
                            && level >= 4
                            && organizationId.equals(currentOrgId);
                })
                .defaultIfEmpty(false)
                .onErrorReturn(false);
    }

    /**
     * Ensures the current user may administer the given organization, otherwise FORBIDDEN.
     * ADMIN: any organization. STAFF: only their own organization.
     */
    public static Mono<Void> assertCanAdministerOrganization(Integer organizationId) {
        return canAdministerOrganization(organizationId)
                .flatMap(allowed -> allowed
                        ? Mono.<Void>empty()
                        : Mono.<Void>error(new ApplicationException(
                                ErrorCode.FORBIDDEN,
                                "You can only manage your own organization")));
    }

    /**
     * Tenant-isolation guard for admin/moderation actions on org-scoped targets: ADMIN may act on
     * any organization; every other role may act ONLY on the organization carried by their token.
     * Stops cross-tenant manipulation (e.g. a STAFF/MODERATOR of org A moderating org B's data).
     * Fail-closed: an unauthenticated/roleless caller is rejected.
     */
    public static Mono<Void> assertSameOrganizationOrAdmin(Integer organizationId) {
        return Mono.zip(getCurrentUserRole(), getCurrentOrganizationId().defaultIfEmpty(-1))
                .flatMap(t -> {
                    boolean ok = "ADMIN".equalsIgnoreCase(t.getT1())
                            || (organizationId != null && organizationId.equals(t.getT2()));
                    return ok
                            ? Mono.<Void>empty()
                            : Mono.<Void>error(new ApplicationException(ErrorCode.FORBIDDEN, "You can only manage data in your own organization"));
                })
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "You can only manage data in your own organization")));
    }

    /**
     * Resolves the effective organizationId for the current user.
     * STAFF: always returns their own organizationId from the JWT (ignores requestedOrgId).
     * ADMIN: returns Mono.just(requestedOrgId) if non-null, else Mono.empty() (meaning "all orgs").
     */
    public static Mono<Integer> resolveOrganizationId(Integer requestedOrgId) {
        return getCurrentUserRole()
                .flatMap(role -> {
                    if ("STAFF".equalsIgnoreCase(role)) {
                        return getCurrentOrganizationId();
                    }
                    return requestedOrgId != null ? Mono.just(requestedOrgId) : Mono.empty();
                });
    }

    /**
     * Resolve the organization for content creation.
     * STAFF must always use their token organization.
     * ADMIN/USER create content for the organization currently selected by the UI slug.
     */
    public static Mono<Integer> resolveContentOrganizationId(Integer requestedOrgId) {
        return getCurrentUserRole()
                .flatMap(role -> {
                    if ("STAFF".equalsIgnoreCase(role)) {
                        return getCurrentOrganizationId();
                    }
                    return requestedOrgId != null ? Mono.just(requestedOrgId) : getCurrentOrganizationId();
                });
    }

    public static Mono<Integer> resolvePublicOrganizationId(Integer requestedOrgId) {
        return requestedOrgId != null
                ? Mono.just(requestedOrgId)
                : getCurrentOrganizationId();
    }
}
