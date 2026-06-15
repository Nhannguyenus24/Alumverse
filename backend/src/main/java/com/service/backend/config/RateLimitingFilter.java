package com.service.backend.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Component
public class RateLimitingFilter implements WebFilter {
    private enum RateLimitPlan {
        AUTH(5, Duration.ofMinutes(1)),      // Các API nhạy cảm: 5 requests / phút
        UPLOAD(5, Duration.ofMinutes(1)),   // Các API upload file: 5 requests / phút
        DEFAULT(30, Duration.ofMinutes(1)); // API thông thường: 30 requests / phút

        private final Bandwidth limit;

        RateLimitPlan(int capacity, Duration duration) {
            Refill refill = Refill.greedy(capacity, duration);
            this.limit = Bandwidth.classic(capacity, refill);
        }

        public Bandwidth getLimit() { return limit; }
    }

    // Cache lưu trữ Bucket theo key: "IP_ADDRESS:PLAN_NAME"
    private final Cache<String, Bucket> cache = Caffeine.newBuilder()
            .maximumSize(20_000)
            .expireAfterAccess(Duration.ofMinutes(10))
            .build();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        
        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs") || path.startsWith("/actuator")) {
            return chain.filter(exchange);
        }

        String clientIp = getClientIp(exchange);
        RateLimitPlan plan = determinePlan(path);
        String cacheKey = clientIp + ":" + plan.name();

        // Lấy hoặc tạo bucket. newBucket chỉ add config đã được cache (plan.getLimit())
        Bucket bucket = cache.get(cacheKey, k -> Bucket.builder().addLimit(plan.getLimit()).build());

        if (bucket != null && bucket.tryConsume(1)) {
            return chain.filter(exchange);
        } else {
            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            return exchange.getResponse().setComplete();
        }
    }

    private RateLimitPlan determinePlan(String path) {
        if (path.startsWith("/api/auth/") || path.startsWith("/api/v1/auth/")) {
            return RateLimitPlan.AUTH;
        }
        if (path.contains("/upload") || path.contains("/images")) {
            return RateLimitPlan.UPLOAD;
        }
        return RateLimitPlan.DEFAULT;
    }

    private String getClientIp(ServerWebExchange exchange) {
        String ip = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            return exchange.getRequest().getRemoteAddress() != null 
                 ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress() 
                 : "unknown";
        }
        
        int commaIndex = ip.indexOf(',');
        if (commaIndex > 0) {
            return ip.substring(0, commaIndex).trim();
        }
        return ip.trim();
    }
}
