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

import com.service.backend.shared.utils.AuthExchangeAttributes;
import com.service.backend.shared.utils.JwtUtils;

import reactor.core.publisher.Mono;

@Configuration
@EnableWebFluxSecurity
@org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    /**
     * Allowlist for NON-controller resources only: infrastructure paths, static assets,
     * websockets, actuator and external webhooks that have no handler method to annotate.
     *
     * Do NOT add controller routes here. Controller endpoints declare their access rule
     * at the method (or class) via {@code @PublicEndpoint} / {@code @PreAuthorize}; anything
     * unannotated is authenticated by default. Adding a controller path here would make it
     * public for ALL HTTP methods and bypass that per-method model.
     */
    private static final String[] INFRA_PUBLIC_URLS = {
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
            "/api/payment/sepay/webhook",
            "/actuator/**",
            "/internal/actuator/**"
    };

    @Value("${app.cors.allowed-origin-patterns:}")
    private String extraOriginPatterns;

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http, JwtUtils jwtUtils, PublicEndpointConfig publicEndpointConfig) {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .addFilterAt(headerAuthenticationFilter(jwtUtils, publicEndpointConfig), SecurityWebFiltersOrder.AUTHENTICATION)
                .authorizeExchange(auth -> {
                    auth.pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers(INFRA_PUBLIC_URLS).permitAll();
                    // Public endpoints discovered via @PublicEndpoint are permitted only for
                    // the exact HTTP method they were declared with, so a public GET does not
                    // expose a sibling POST/PUT/DELETE on the same path to unauthenticated calls.
                    publicEndpointConfig.getPublicUrlsByMethod().forEach((method, patterns) ->
                            auth.pathMatchers(method, patterns.toArray(new String[0])).permitAll());
                    String[] methodAgnostic = publicEndpointConfig.getMethodAgnosticPublicUrlsArray();
                    if (methodAgnostic.length > 0) {
                        auth.pathMatchers(methodAgnostic).permitAll();
                    }
                    auth.anyExchange().authenticated();
                });

        return http.build();
    }

    private WebFilter headerAuthenticationFilter(JwtUtils jwtUtils, PublicEndpointConfig publicEndpointConfig) {
        List<ServerWebExchangeMatcher> matchers = new ArrayList<>();
        matchers.add(ServerWebExchangeMatchers.pathMatchers(HttpMethod.OPTIONS, "/**"));
        matchers.add(ServerWebExchangeMatchers.pathMatchers(INFRA_PUBLIC_URLS));
        publicEndpointConfig.getPublicUrlsByMethod().forEach((method, patterns) ->
                matchers.add(ServerWebExchangeMatchers.pathMatchers(method, patterns.toArray(new String[0]))));
        String[] methodAgnostic = publicEndpointConfig.getMethodAgnosticPublicUrlsArray();
        if (methodAgnostic.length > 0) {
            matchers.add(ServerWebExchangeMatchers.pathMatchers(methodAgnostic));
        }
        ServerWebExchangeMatcher publicMatcher = ServerWebExchangeMatchers.matchers(
                matchers.toArray(new ServerWebExchangeMatcher[0]));

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
                        com.nimbusds.jwt.JWTClaimsSet claims = jwtUtils.validateToken(token);
                        Integer userId = Integer.valueOf(claims.getSubject());
                        String userRole = (String) claims.getClaim("role");
                        Object orgIdClaim = claims.getClaim("organizationId");
                        Integer organizationId = orgIdClaim instanceof Number ? ((Number) orgIdClaim).intValue() : null;
                        Object verificationLevelClaim = claims.getClaim("verificationLevel");
                        Integer verificationLevel = verificationLevelClaim instanceof Number
                                ? ((Number) verificationLevelClaim).intValue()
                                : null;

                        if (userRole == null) {
                            if (isPublic) return chain.filter(exchange);
                            return Mono.error(new RuntimeException("Invalid token: missing user ID or role"));
                        }

                        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + userRole));
                        if (verificationLevel != null) {
                            authorities.add(new SimpleGrantedAuthority("VERIFICATION_LEVEL_" + verificationLevel));
                        }

                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                String.valueOf(userId),
                                null,
                                authorities);
                        auth.setDetails(organizationId);

                        // Stash the resolved identity into exchange attributes so downstream
                        // WebFilters (e.g. AdminAuditWebFilter) can read who performed the
                        // request without depending on the reactive security context.
                        exchange.getAttributes().put(AuthExchangeAttributes.USER_ID, userId);
                        exchange.getAttributes().put(AuthExchangeAttributes.ROLE, userRole);
                        if (organizationId != null) {
                            exchange.getAttributes().put(AuthExchangeAttributes.ORGANIZATION_ID, organizationId);
                        }

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
