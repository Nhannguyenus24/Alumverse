package com.service.backend.config;

import com.service.backend.shared.annotations.PublicEndpoint;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.reactive.result.method.annotation.RequestMappingHandlerMapping;
import org.springframework.web.util.pattern.PathPattern;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
@Slf4j
public class PublicEndpointConfig {

    private final RequestMappingHandlerMapping handlerMapping;
    
    @Getter
    private final Set<String> annotatedPublicUrls = new HashSet<>();

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
                
                Set<String> methods = mapping.getMethodsCondition().getMethods().stream()
                        .map(Enum::name)
                        .collect(Collectors.toSet());
                
                String methodsString = methods.isEmpty() ? "[ANY]" : methods.toString();
                
                patterns.forEach(pattern -> {
                    logEntries.add(String.format("%-20s %s", methodsString, pattern));
                    annotatedPublicUrls.add(pattern);
                });
            }
        });
        String formattedUrls = logEntries.stream()
                .sorted()
                .map(entry -> "  - " + entry)
                .collect(Collectors.joining("\n"));
        log.info("Registered {} public endpoint patterns:\n{}", annotatedPublicUrls.size(), formattedUrls);
    }

    public String[] getAnnotatedPublicUrlsArray() {
        return annotatedPublicUrls.toArray(new String[0]);
    }
}
