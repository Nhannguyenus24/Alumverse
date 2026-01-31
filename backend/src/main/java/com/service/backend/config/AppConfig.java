package com.service.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.service.backend.shared.utils.JwtUtils;

@Configuration
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
}
