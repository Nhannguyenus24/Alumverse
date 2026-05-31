package com.service.backend.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;

import com.service.backend.shared.utils.JwtUtils;

import reactor.core.publisher.Mono;

@Component
@Order(-100) // Run before Spring Security filters
public class HeaderAuthenticationFilter implements WebFilter {

    private static final Logger logger = LoggerFactory.getLogger(HeaderAuthenticationFilter.class);
    private final JwtUtils jwtUtils;

    public HeaderAuthenticationFilter(
            JwtUtils jU) {
        this.jwtUtils = jU;
    }

    private static boolean isPublicMentorshipBrowse(String path) {
        if (path.equals("/api/mentorship/mentee/expertise-topics")
                || path.equals("/api/mentorship/mentee/expertise-categories")) {
            return true;
        }
        if (!path.startsWith("/api/mentorship/mentee/mentors")) {
            return false;
        }
        return !path.startsWith("/api/mentorship/mentee/sessions");
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        HttpMethod method = exchange.getRequest().getMethod();

        if (HttpMethod.OPTIONS.equals(method)) {
            return chain.filter(exchange);
        }

        // Skip authentication for public endpoints
        if (path.equals("/health") ||
                path.startsWith("/api/auth/") ||
                path.startsWith("/swagger-ui") ||
                path.startsWith("/webjars/") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/api/guest") ||
                path.startsWith("/api/organizations") ||
                path.startsWith("/api/funds") ||
                path.startsWith("/api/fund-donations") ||
                path.startsWith("/api/fund-statuses") ||
                path.startsWith("/api/payment") ||
                path.startsWith("/websocket-test.html") ||
                path.endsWith(".html") ||
                path.endsWith(".css") ||
                path.endsWith(".js") ||
                path.endsWith(".png") ||
                path.endsWith(".ico") ||
                path.startsWith("/static/") ||
                path.startsWith("/ws/chat")) {
            return chain.filter(exchange);
        }

        if (HttpMethod.GET.equals(method) && isPublicMentorshipBrowse(path)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("No valid Bearer token found for {}", path);
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            exchange.getResponse().getHeaders().add(HttpHeaders.CONTENT_TYPE, "application/json");
            String errorResponse = "{\"message\":\"Request is not authenticated\",\"error\":\"UNAUTHORIZED\"}";
            return exchange.getResponse().writeWith(
                    Mono.just(exchange.getResponse().bufferFactory().wrap(errorResponse.getBytes())));
        }

        String token = authHeader.substring(7);

        try {
            // Validate token (includes expiration check)
            Integer userId = jwtUtils.getUserIdFromToken(token);
            String userRole = jwtUtils.getRoleFromToken(token);
            Integer organizationId = jwtUtils.getOrganizationIdFromToken(token);

            if (userId == null || userRole == null) {
                throw new RuntimeException("Invalid token: missing user ID or role");
            }

            // Token is valid and not expired. Stash orgId in `details` for SecurityUtils.
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    String.valueOf(userId),
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + userRole)));
            auth.setDetails(organizationId);

            return chain.filter(exchange)
                    .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));

        } catch (RuntimeException e) {
            // Token validation failed (invalid, expired, or malformed)
            String message = e.getMessage();
            String errorCode = "INVALID_TOKEN";

            logger.error("Token validation failed for path: {} - Error: {}", path, message, e);

            // Provide specific error code for expired tokens to enable client refresh logic
            if (message != null && message.contains("expired")) {
                errorCode = "TOKEN_EXPIRED";
                logger.warn("Token has expired for path: {}", path);
            }
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            exchange.getResponse().getHeaders().add(HttpHeaders.CONTENT_TYPE, "application/json");

            String errorResponse = "{\"message\":\"" + (message != null ? message : "Token validation failed")
                    + "\",\"error\":\"" + errorCode + "\"}";
            return exchange.getResponse().writeWith(
                    Mono.just(exchange.getResponse().bufferFactory().wrap(errorResponse.getBytes())));
        }
    }
}
