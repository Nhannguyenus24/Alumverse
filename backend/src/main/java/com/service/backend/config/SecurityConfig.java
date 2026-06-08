package com.service.backend.config;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;

import com.service.backend.shared.utils.JwtUtils;

import reactor.core.publisher.Mono;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    private static final String[] PUBLIC_URLS = {
            "/health",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**",
            "/webjars/**",
            "/websocket-test.html",
            "/ws/chat",
            "/ws/chat/**",
            "/*.html",
            "/*.css",
            "/*.js",
            "/*.png",
            "/*.ico",
            "/static/**",
    };

    @Value("${app.cors.allowed-origin-patterns:}")
    private String extraOriginPatterns;

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http, JwtUtils jwtUtils, PublicEndpointConfig publicEndpointConfig) {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .addFilterAt(headerAuthenticationFilter(jwtUtils, publicEndpointConfig), SecurityWebFiltersOrder.AUTHENTICATION)
                .authorizeExchange(auth -> auth
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers(PUBLIC_URLS).permitAll()
                        .pathMatchers(publicEndpointConfig.getAnnotatedPublicUrlsArray()).permitAll()
                        .anyExchange().authenticated());

        return http.build();
    }

    private WebFilter headerAuthenticationFilter(JwtUtils jwtUtils, PublicEndpointConfig publicEndpointConfig) {
        ServerWebExchangeMatcher publicMatcher = ServerWebExchangeMatchers.matchers(
                ServerWebExchangeMatchers.pathMatchers(HttpMethod.OPTIONS, "/**"),
                ServerWebExchangeMatchers.pathMatchers(PUBLIC_URLS),
                ServerWebExchangeMatchers.pathMatchers(publicEndpointConfig.getAnnotatedPublicUrlsArray())
        );

        return (exchange, chain) -> publicMatcher.matches(exchange)
                .flatMap(matchResult -> {
                    String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
                    boolean isPublic = matchResult.isMatch();

                    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                        if (isPublic) {
                            return chain.filter(exchange);
                        }
                        return unauthenticatedResponse(exchange, "Request is not authenticated", "UNAUTHORIZED");
                    }

                    String token = authHeader.substring(7);

                    try {
                        Integer userId = jwtUtils.getUserIdFromToken(token);
                        String userRole = jwtUtils.getRoleFromToken(token);
                        Integer organizationId = jwtUtils.getOrganizationIdFromToken(token);

                        if (userId == null || userRole == null) {
                            if (isPublic) return chain.filter(exchange);
                            return Mono.error(new RuntimeException("Invalid token: missing user ID or role"));
                        }

                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                String.valueOf(userId),
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + userRole)));
                        auth.setDetails(organizationId);

                        return chain.filter(exchange)
                                .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));

                    } catch (RuntimeException e) {
                        if (isPublic) {
                            return chain.filter(exchange);
                        }
                        String message = e.getMessage();
                        String errorCode = "INVALID_TOKEN";

                        if (message != null && message.contains("expired")) {
                            errorCode = "TOKEN_EXPIRED";
                        }
                        return unauthenticatedResponse(exchange, message != null ? message : "Token validation failed", errorCode);
                    }
                });
    }

    private Mono<Void> unauthenticatedResponse(ServerWebExchange exchange, String message, String errorCode) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().add(HttpHeaders.CONTENT_TYPE, "application/json");
        String errorResponse = String.format("{\"message\":\"%s\",\"error\":\"%s\"}", message, errorCode);
        return exchange.getResponse().writeWith(
                Mono.just(exchange.getResponse().bufferFactory().wrap(errorResponse.getBytes())));
    }

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

        return exchange -> {
            ServerHttpRequest request = exchange.getRequest();
            String origin = request.getHeaders().getOrigin();
            if (origin == null) {
                return source.getCorsConfiguration(exchange);
            }
            CorsConfiguration resolved = source.getCorsConfiguration(exchange);
            boolean allowed = patterns.stream().anyMatch(p -> matchesOriginPattern(p, origin));
            if (!allowed) {
                log.warn("CORS blocked: origin='{}' path='{}'", origin, request.getPath());
            }
            return resolved;
        };
    }

    private boolean matchesOriginPattern(String pattern, String origin) {
        String regex = pattern
                .replace(".", "\\.")
                .replace("*", "[^/]*");
        return origin.matches(regex);
    }
}
