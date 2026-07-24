package com.service.backend.config;

import com.service.backend.shared.annotations.PublicEndpoint;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.result.method.annotation.RequestMappingHandlerMapping;
import org.springframework.web.util.pattern.PathPattern;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Discovers endpoints annotated as public and exposes them to {@link SecurityConfig}.
 *
 * IMPORTANT: public endpoints are tracked per HTTP method. A path pattern being public
 * for GET must NOT make the same path public for POST/PUT/DELETE. Previously only the
 * path pattern was recorded (method-blind), which meant a public {@code @GetMapping("/x")}
 * silently exposed a sibling {@code @PostMapping("/x")} to unauthenticated callers.
 */
@Configuration
@Slf4j
public class PublicEndpointConfig {

    private final RequestMappingHandlerMapping handlerMapping;

    /** Public URL patterns grouped by the HTTP method they were declared for. */
    @Getter
    private final Map<HttpMethod, Set<String>> publicUrlsByMethod = new HashMap<>();

    /**
     * Public patterns declared without any HTTP method restriction (mapping matches any verb).
     * These stay method-agnostic to preserve the original behaviour for such mappings.
     */
    @Getter
    private final Set<String> methodAgnosticPublicUrls = new HashSet<>();

    public PublicEndpointConfig(@Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping handlerMapping) {
        this.handlerMapping = handlerMapping;
    }

    @PostConstruct
    public void init() {
        Set<String> logEntries = new HashSet<>();
        handlerMapping.getHandlerMethods().forEach((mapping, method) -> {
            boolean hasPrivateOverride = method.hasMethodAnnotation(com.service.backend.shared.annotations.PrivateEndpoint.class);
            boolean isPublic = !hasPrivateOverride && (method.hasMethodAnnotation(PublicEndpoint.class) ||
                             method.getBeanType().isAnnotationPresent(PublicEndpoint.class));

            if (isPublic) {
                Set<String> patterns = mapping.getPatternsCondition().getPatterns().stream()
                        .map(PathPattern::getPatternString)
                        .collect(Collectors.toSet());

                Set<HttpMethod> httpMethods = mapping.getMethodsCondition().getMethods().stream()
                        .map(rm -> HttpMethod.valueOf(rm.name()))
                        .collect(Collectors.toSet());

                String methodsString = httpMethods.isEmpty() ? "[ANY]" : httpMethods.toString();

                patterns.forEach(pattern -> {
                    logEntries.add(String.format("%-20s %s", methodsString, pattern));
                    if (httpMethods.isEmpty()) {
                        methodAgnosticPublicUrls.add(pattern);
                    } else {
                        httpMethods.forEach(hm -> publicUrlsByMethod
                                .computeIfAbsent(hm, k -> new HashSet<>())
                                .add(pattern));
                    }
                });
            }
        });
        long total = methodAgnosticPublicUrls.size()
                + publicUrlsByMethod.values().stream().mapToLong(Set::size).sum();
        String formattedUrls = logEntries.stream()
                .sorted()
                .map(entry -> "  - " + entry)
                .collect(Collectors.joining("\n"));
        log.info("Registered {} public endpoint patterns:\n{}", total, formattedUrls);
    }

    public String[] getMethodAgnosticPublicUrlsArray() {
        return methodAgnosticPublicUrls.toArray(new String[0]);
    }
}
