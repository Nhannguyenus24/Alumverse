package com.service.backend.config;

import com.service.backend.shared.annotations.PublicEndpoint;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.result.method.annotation.RequestMappingHandlerMapping;
import org.springframework.web.util.pattern.PathPattern;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class PublicEndpointConfig {

    private final RequestMappingHandlerMapping handlerMapping;
    
    @Getter
    private final Set<String> annotatedPublicUrls = new HashSet<>();

    @PostConstruct
    public void init() {
        handlerMapping.getHandlerMethods().forEach((mapping, method) -> {
            boolean isPublic = method.hasMethodAnnotation(PublicEndpoint.class) || 
                             method.getBeanType().isAnnotationPresent(PublicEndpoint.class);
            
            if (isPublic) {
                Set<String> patterns = mapping.getPatternsCondition().getPatterns().stream()
                        .map(PathPattern::getPatternString)
                        .collect(Collectors.toSet());
                
                log.info("Registered public endpoint patterns from {}: {}", 
                    method.getBeanType().getSimpleName() + "#" + method.getMethod().getName(), 
                    patterns);
                annotatedPublicUrls.addAll(patterns);
            }
        });
    }

    public String[] getAnnotatedPublicUrlsArray() {
        return annotatedPublicUrls.toArray(new String[0]);
    }
}
