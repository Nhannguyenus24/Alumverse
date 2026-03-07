package com.service.backend.filter;

import java.util.List;

import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
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

    private final JwtUtils jwtUtils;

    public HeaderAuthenticationFilter(
            JwtUtils jU
    ) {
        this.jwtUtils = jU;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        
        // Skip authentication for public endpoints
        // No ko pass ngay cho nay
        if (path.startsWith("/api/auth/") ||
            path.startsWith("/swagger-ui") ||
            path.startsWith("/webjars/") ||
            path.startsWith("/v3/api-docs") ||
            path.startsWith("/api/guest") ||
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

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            exchange.getResponse().getHeaders().add(HttpHeaders.CONTENT_TYPE, "application/json");
            String errorResponse = "{\"message\":\"Request is not authenticated\",\"error\":\"UNAUTHORIZED\"}";
            return exchange.getResponse().writeWith(
                Mono.just(exchange.getResponse().bufferFactory().wrap(errorResponse.getBytes()))
            );
        }

        String token = authHeader.substring(7);

        try {
            // Validate token (includes expiration check)
            Integer userId = jwtUtils.getUserIdFromToken(token);
            String userRole = jwtUtils.getRoleFromToken(token);

            if (userId == null || userRole == null) {
                throw new RuntimeException("Invalid token: missing user ID or role");
            }

            // Token is valid and not expired
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                    String.valueOf(userId),
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + userRole))
                );

            return chain.filter(exchange)
                .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));

        } catch (RuntimeException e) {
            // Token validation failed (invalid, expired, or malformed)
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            exchange.getResponse().getHeaders().add(HttpHeaders.CONTENT_TYPE, "application/json");
            
            String message = e.getMessage();
            String errorCode = "INVALID_TOKEN";
            
            // Provide specific error code for expired tokens to enable client refresh logic
            if (message != null && message.contains("expired")) {
                errorCode = "TOKEN_EXPIRED";
            }
            
            String errorResponse = "{\"message\":\"" + (message != null ? message : "Token validation failed") 
                    + "\",\"error\":\"" + errorCode + "\"}";
            return exchange.getResponse().writeWith(
                Mono.just(exchange.getResponse().bufferFactory().wrap(errorResponse.getBytes()))
            );
        }
    }
}
