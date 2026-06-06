package com.service.backend.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.reactive.function.client.WebClient;
import com.service.backend.shared.utils.JwtUtils;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableScheduling
public class AppConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration_access}")
    private long accessTokenExpirationMs;

    @Value("${jwt.expiration_refresh}")
    private long refreshTokenExpirationMs;

    @Bean
    public JwtUtils jwtUtils() {
        return new JwtUtils(jwtSecret, accessTokenExpirationMs, refreshTokenExpirationMs);
    }

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }

    // key: "{topicId}:{postId}", value: post created_at — TTL 4h covers the 3h cron cycle
    @Bean
    public Cache<String, LocalDateTime> forumRecentPostsCache() {
        return Caffeine.newBuilder()
                .expireAfterWrite(4, TimeUnit.HOURS)
                .build();
    }
}
