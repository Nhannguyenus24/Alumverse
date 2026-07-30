package com.service.backend.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.Getter;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import org.springframework.http.MediaType;
import org.springframework.core.io.buffer.DataBuffer;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;

import java.time.Duration;

@Component
public class RateLimitingFilter implements WebFilter, Ordered {

    private final ObjectMapper objectMapper;
    private final MeterRegistry meterRegistry;

    public RateLimitingFilter(ObjectMapper objectMapper, MeterRegistry meterRegistry) {
        this.objectMapper = objectMapper;
        this.meterRegistry = meterRegistry;
    }

    /**
     * Run before Spring Security's WebFilterChainProxy (order -100) so a flood is throttled at the
     * very edge, before it can drive authentication/authorization work. Unordered WebFilters
     * otherwise default to LOWEST_PRECEDENCE (after security), which defeats the purpose.
     */
    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Getter
    private enum RateLimitPlan {
        AUTH(5, Duration.ofMinutes(1)),      // Các API nhạy cảm: 5 requests / phút
        UPLOAD(5, Duration.ofMinutes(1)),   // Các API upload file: 5 requests / phút
        FEEDBACK(3, Duration.ofMinutes(1)),  // Feedback công khai (khách vãng lai): 3 requests / phút chống spam
        DEFAULT(100, Duration.ofMinutes(1)); // API thông thường: 100 requests / phút

        private final Bandwidth limit;

        RateLimitPlan(int capacity, Duration duration) {
            Refill refill = Refill.greedy(capacity, duration);
            this.limit = Bandwidth.classic(capacity, refill);
        }

    }

    // Cache lưu trữ Bucket theo key: "IP_ADDRESS:PLAN_NAME"
    private final Cache<String, Bucket> cache = Caffeine.newBuilder()
            .maximumSize(20_000)
            .expireAfterAccess(Duration.ofMinutes(10))
            .build();

    @Override
    public @NonNull Mono<Void> filter(ServerWebExchange exchange, @NonNull WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
            return chain.filter(exchange);
        }
        
        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs") || path.startsWith("/actuator") || path.startsWith("/internal/actuator")) {
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
            meterRegistry.counter("ratelimit.rejected", "plan", plan.name()).increment();
            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            
            ApplicationException ex = new ApplicationException(ErrorCode.TOO_MANY_REQUESTS);
            ApiResponse<?> apiResponse = ApiResponse.error(ex.getErrorCode());
            
            try {
                byte[] bytes = objectMapper.writeValueAsBytes(apiResponse);
                DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(bytes);
                return exchange.getResponse().writeWith(Mono.just(buffer));
            } catch (JsonProcessingException e) {
                return exchange.getResponse().setComplete();
            }
        }
    }

    private RateLimitPlan determinePlan(String path) {
        if (path.startsWith("/api/auth/") || path.startsWith("/api/v1/auth/")) {
            return RateLimitPlan.AUTH;
        }
        // Public guest feedback form (POST /api/organizations/{id}/feedbacks) — throttle hard per IP
        // to curb anonymous spam. Excludes admin listing endpoints under /admin/.
        if (path.endsWith("/feedbacks") && !path.contains("/admin/")) {
            return RateLimitPlan.FEEDBACK;
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
