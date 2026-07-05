package com.service.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.ResourceHandlerRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;

@Configuration
public class WebFluxConfig implements WebFluxConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Explicitly register only specific resource paths
        // This ensures that /actuator and other API paths are NOT handled as static resources

        // Webjars for Swagger UI and other dependencies
        registry.addResourceHandler("/webjars/**")
                .addResourceLocations("classpath:/META-INF/resources/webjars/")
                .resourceChain(true);

        // Swagger UI static files
        registry.addResourceHandler("/swagger-ui/**")
                .addResourceLocations("classpath:/META-INF/resources/")
                .resourceChain(true);

        // Static resources directory
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true);

        // Root-level static files only (index.html, etc.)
        registry.addResourceHandler("/", "/*.html", "/*.css", "/*.js")
                .addResourceLocations("classpath:/static/", "classpath:/public/")
                .resourceChain(true);
    }
}
