package com.service.backend.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;

/**
 * Configuration for rate limiting using Bucket4j.
 * Implements token bucket algorithm with different rate limits for different endpoint types.
 */
@Configuration
public class RateLimitConfig {
    
    @Value("${rate.limit.auth.capacity:20}")
    private int authCapacity;
    
    @Value("${rate.limit.auth.refill.tokens:20}")
    private int authRefillTokens;
    
    @Value("${rate.limit.auth.refill.period:60}")
    private int authRefillPeriodSeconds;
    
    @Value("${rate.limit.public.capacity:100}")
    private int publicCapacity;
    
    @Value("${rate.limit.public.refill.tokens:100}")
    private int publicRefillTokens;
    
    @Value("${rate.limit.public.refill.period:60}")
    private int publicRefillPeriodSeconds;
    
    @Value("${rate.limit.authenticated.capacity:200}")
    private int authenticatedCapacity;
    
    @Value("${rate.limit.authenticated.refill.tokens:200}")
    private int authenticatedRefillTokens;
    
    @Value("${rate.limit.authenticated.refill.period:60}")
    private int authenticatedRefillPeriodSeconds;
    
    @Value("${rate.limit.cache.max.size:10000}")
    private int cacheMaxSize;
    
    @Value("${rate.limit.cache.expire.after.access.minutes:10}")
    private int cacheExpireMinutes;
    
    /**
     * Creates a Caffeine cache for storing rate limit buckets.
     * Buckets are cached and automatically expire after inactivity.
     */
    @Bean
    public Cache<String, Bucket> bucketCache() {
        return Caffeine.newBuilder()
                .maximumSize(cacheMaxSize)
                .expireAfterAccess(Duration.ofMinutes(cacheExpireMinutes))
                .build();
    }
    
    /**
     * Creates bandwidth limit for authentication endpoints.
     * More restrictive to prevent brute force attacks.
     */
    public Bandwidth authBandwidth() {
        return Bandwidth.builder()
            .capacity(authCapacity)
            .refillIntervally(authRefillTokens, Duration.ofSeconds(authRefillPeriodSeconds))
            .build();
    }
    
    /**
     * Creates bandwidth limit for public endpoints.
     * Moderate limits for unauthenticated users.
     */
    public Bandwidth publicBandwidth() {
        return Bandwidth.builder()
            .capacity(publicCapacity)
            .refillIntervally(publicRefillTokens, Duration.ofSeconds(publicRefillPeriodSeconds))
            .build();
    }
    
    /**
     * Creates bandwidth limit for authenticated user endpoints.
     * More generous limits for authenticated users.
     */
    public Bandwidth authenticatedBandwidth() {
        return Bandwidth.builder()
            .capacity(authenticatedCapacity)
            .refillIntervally(authenticatedRefillTokens, Duration.ofSeconds(authenticatedRefillPeriodSeconds))
            .build();
    }
    
    /**
     * Gets the appropriate bandwidth limit based on the endpoint path.
     */
    public Bandwidth getBandwidth(String path) {
        if (path.startsWith("/api/auth/")) {
            return authBandwidth();
        } else if (path.startsWith("/api/guest/") || path.startsWith("/swagger-ui/") || path.startsWith("/api-docs/")) {
            return publicBandwidth();
        } else {
            return authenticatedBandwidth();
        }
    }
}
