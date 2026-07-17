package com.service.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;

import com.service.backend.admin.dto.AdminAuditEntry;
import com.service.backend.admin.service.AdminAuditService;
import com.service.backend.shared.utils.AuthExchangeAttributes;

import reactor.core.publisher.Mono;

/**
 * Automatically records every state-changing request against the admin dashboard
 * ({@code POST/PUT/PATCH/DELETE} under {@code /api/admin/**}) so the audit trail has
 * complete coverage without each of the ~12 admin controllers having to log by hand.
 *
 * <p>The acting admin is read from exchange attributes populated by the authentication
 * filter (the reactive security context is not visible from a filter's own terminal
 * callback). Persistence is fire-and-forget: it runs after the response completes and can
 * never fail or slow down the request it describes.
 *
 * <p>Semantically-rich entries (bans, deletes, moderation with before/after snapshots) are
 * still written explicitly by the services via {@link AdminAuditService#recordSemantic}; the
 * two layers are complementary and both keyed to the same admin + timestamp.
 */
@Component
@Order(-50)
public class AdminAuditWebFilter implements WebFilter {

    private static final Logger log = LoggerFactory.getLogger(AdminAuditWebFilter.class);

    private static final String ADMIN_PREFIX = "/api/admin/";

    private final AdminAuditService adminAuditService;

    public AdminAuditWebFilter(AdminAuditService adminAuditService) {
        this.adminAuditService = adminAuditService;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        HttpMethod method = exchange.getRequest().getMethod();

        if (!isAuditableAdminMutation(path, method)) {
            return chain.filter(exchange);
        }

        long startTime = System.currentTimeMillis();
        return chain.filter(exchange)
                .doFinally(signalType -> recordSafely(exchange, path, method, startTime));
    }

    private boolean isAuditableAdminMutation(String path, HttpMethod method) {
        if (path == null || !path.startsWith(ADMIN_PREFIX)) {
            return false;
        }
        return HttpMethod.POST.equals(method)
                || HttpMethod.PUT.equals(method)
                || HttpMethod.PATCH.equals(method)
                || HttpMethod.DELETE.equals(method);
    }

    private void recordSafely(ServerWebExchange exchange, String path, HttpMethod method, long startTime) {
        try {
            Object adminIdAttr = exchange.getAttribute(AuthExchangeAttributes.USER_ID);
            if (!(adminIdAttr instanceof Integer adminUserId)) {
                // No authenticated admin resolved (e.g. 401 before the controller) — nothing to attribute.
                return;
            }

            Integer statusCode = exchange.getResponse().getStatusCode() != null
                    ? exchange.getResponse().getStatusCode().value()
                    : 500;
            long latency = System.currentTimeMillis() - startTime;

            AdminAuditEntry entry = AdminAuditEntry.builder()
                    .adminUserId(adminUserId)
                    .adminRole(stringAttr(exchange, AuthExchangeAttributes.ROLE))
                    .action(actionForMethod(method))
                    .resourceType(resourceTypeFromPath(path))
                    .resourceId(resourceIdFromPath(path))
                    .httpMethod(method.name())
                    .requestPath(path)
                    .ipAddress(clientIp(exchange))
                    .userAgent(exchange.getRequest().getHeaders().getFirst("User-Agent"))
                    .statusCode(statusCode)
                    .latencyMs(latency)
                    .status(statusCode >= 400 ? AdminAuditService.STATUS_FAILURE : AdminAuditService.STATUS_SUCCESS)
                    .build();

            adminAuditService.record(entry).subscribe(
                    null,
                    err -> log.warn("Admin audit auto-capture failed for {} {}", method, path, err));
        } catch (Exception e) {
            // Auditing must never break the request it describes.
            log.warn("Admin audit auto-capture threw for {} {}", method, path, e);
        }
    }

    private String actionForMethod(HttpMethod method) {
        if (HttpMethod.POST.equals(method)) {
            return "CREATE";
        }
        if (HttpMethod.DELETE.equals(method)) {
            return "DELETE";
        }
        return "UPDATE"; // PUT / PATCH
    }

    /**
     * Resource type = the first meaningful segment after {@code /api/admin/}, uppercased.
     * e.g. {@code /api/admin/users/42/ban} -> {@code USERS}.
     */
    private String resourceTypeFromPath(String path) {
        String rest = path.substring(ADMIN_PREFIX.length());
        int slash = rest.indexOf('/');
        String segment = slash >= 0 ? rest.substring(0, slash) : rest;
        if (segment.isBlank()) {
            return "ADMIN";
        }
        return segment.toUpperCase().replace('-', '_');
    }

    /** First numeric path segment, if any — the id the action targeted. */
    private String resourceIdFromPath(String path) {
        for (String segment : path.split("/")) {
            if (!segment.isEmpty() && segment.chars().allMatch(Character::isDigit)) {
                return segment;
            }
        }
        return null;
    }

    private String clientIp(ServerWebExchange exchange) {
        String xff = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return exchange.getRequest().getRemoteAddress() != null
                ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                : null;
    }

    private String stringAttr(ServerWebExchange exchange, String key) {
        Object value = exchange.getAttribute(key);
        return value != null ? value.toString() : null;
    }
}
