package com.service.backend.config;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import reactor.core.publisher.Mono;

/**
 * WebFilter that applies rate limiting to incoming HTTP requests in a reactive WebFlux application.
 * Uses client IP address as the key for rate limiting.
 */
@Component
@Order(1)
public class RateLimitInterceptor implements WebFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitInterceptor.class);

    private final Cache<String, Bucket> bucketCache;
    private final RateLimitConfig rateLimitConfig;
    private final ObjectMapper objectMapper;

    public RateLimitInterceptor(Cache<String, Bucket> bucketCache,
                                RateLimitConfig rateLimitConfig,
                                ObjectMapper objectMapper) {
        this.bucketCache = bucketCache;
        this.rateLimitConfig = rateLimitConfig;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        // Skip rate limiting for OPTIONS requests (CORS preflight)
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequest().getMethod().name())) {
            return chain.filter(exchange);
        }

        String clientIp = getClientIp(exchange);
        String path = exchange.getRequest().getPath().value();
        String key = clientIp + ":" + getEndpointCategory(path);

        // Get or create bucket for this client
        Bucket bucket = bucketCache.get(key, k ->
            Bucket.builder()
                .addLimit(rateLimitConfig.getBandwidth(path))
                .build()
        );

        // Try to consume 1 token
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            // Request is allowed
            exchange.getResponse().getHeaders().add("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            return chain.filter(exchange);
        } else {
            // Rate limit exceeded
            long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000;

            log.warn("Rate limit exceeded for IP: {} on path: {}. Retry after {} seconds",
                     clientIp, path, waitForRefill);

            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            exchange.getResponse().getHeaders().add("X-Rate-Limit-Retry-After-Seconds", String.valueOf(waitForRefill));

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Too Many Requests");
            errorResponse.put("message", "Rate limit exceeded. Please try again later.");
            errorResponse.put("retryAfterSeconds", waitForRefill);
            errorResponse.put("status", HttpStatus.TOO_MANY_REQUESTS.value());

            try {
                byte[] bytes = objectMapper.writeValueAsBytes(errorResponse);
                return exchange.getResponse().writeWith(
                    Mono.just(exchange.getResponse().bufferFactory().wrap(bytes))
                );
            } catch (JsonProcessingException e) {
                log.error("Error writing rate limit response", e);
                return exchange.getResponse().setComplete();
            }
        }
    }

    /**
     * Extracts the client's IP address from the request.
     * Checks X-Forwarded-For header first (for proxied requests).
     */
    private String getClientIp(ServerWebExchange exchange) {
        String xForwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = exchange.getRequest().getHeaders().getFirst("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        // Get remote address from ServerWebExchange
        if (exchange.getRequest().getRemoteAddress() != null) {
            return exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
        }
        
        return "unknown";
    }

    /**
     * Determines the endpoint category for rate limiting purposes.
     * Different categories have different rate limits.
     */
    private String getEndpointCategory(String path) {
        if (path.startsWith("/api/auth/")) {
            return "auth";
        } else if (path.startsWith("/api/guest/") || path.startsWith("/swagger-ui/") || path.startsWith("/api-docs/")) {
            return "public";
        } else {
            return "authenticated";
        }
    }
}
