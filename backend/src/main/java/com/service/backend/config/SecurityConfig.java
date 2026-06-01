package com.service.backend.config;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.server.ServerWebExchange;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    // Comma-separated extra patterns injected from application-prod.properties
    // e.g. https://*-hcmus-alumni.vercel.app,https://hcmus-alumni.vercel.app
    @Value("${app.cors.allowed-origin-patterns:}")
    private String extraOriginPatterns;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> patterns = new ArrayList<>(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://192.168.*.*:*",
                "http://172.*.*.*:*",
                "http://10.*.*.*:*"
        ));
        if (extraOriginPatterns != null && !extraOriginPatterns.isBlank()) {
            Arrays.stream(extraOriginPatterns.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .forEach(patterns::add);
        }

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(patterns);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return new CorsConfigurationSource() {
            @Override
            public CorsConfiguration getCorsConfiguration(ServerWebExchange exchange) {
                ServerHttpRequest request = exchange.getRequest();
                String origin = request.getHeaders().getOrigin();
                if (origin == null) {
                    return source.getCorsConfiguration(exchange);
                }
                CorsConfiguration resolved = source.getCorsConfiguration(exchange);
                // If the origin pattern matches, allowedOrigins will be populated after validation.
                // We detect a block by checking if the origin passes the pattern check ourselves.
                boolean allowed = patterns.stream().anyMatch(p -> matchesOriginPattern(p, origin));
                if (!allowed) {
                    log.warn("CORS blocked: origin='{}' path='{}'", origin, request.getPath());
                }
                return resolved;
            }
        };
    }

    private boolean matchesOriginPattern(String pattern, String origin) {
        // Convert glob-style pattern to regex: * matches any chars except ://
        String regex = pattern
                .replace(".", "\\.")
                .replace("*", "[^/]*");
        return origin.matches(regex);
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http
                // Enable CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Disable CSRF for stateless REST API
                .csrf(ServerHttpSecurity.CsrfSpec::disable)

                // Authorization rules
                .authorizeExchange(auth -> auth
                        // Public endpoints - no authentication required
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers(HttpMethod.GET,
                                "/api/mentorship/mentee/mentors",
                                "/api/mentorship/mentee/mentors/**",
                                "/api/mentorship/mentee/expertise-topics",
                                "/api/mentorship/mentee/expertise-categories"
                        ).permitAll()
                        .pathMatchers(
                                "/health",
                                "/api/auth/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/webjars/**",
                                "/api/guest/**",
                                "/api/organizations/**",
                                "/websocket-test.html",
                                "/ws/chat",
                                "/ws/chat/**",
                                "/*.html",
                                "/*.css",
                                "/*.js",
                                "/*.png",
                                "/*.ico",
                                "/static/**",
                                "/api/funds/**",
                                "/api/fund-statuses",
                                "/api/fund-donations/**",
                                "/api/payment/**"
                        ).permitAll()

                        // All other requests require authentication
                        .anyExchange().authenticated());

        return http.build();
    }
}
