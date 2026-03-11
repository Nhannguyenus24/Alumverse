package com.service.backend.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

@Configuration
public class OpenApiConfig {
    private static final Logger log = LoggerFactory.getLogger(OpenApiConfig.class);

    @Bean
    public OpenAPI customOpenAPI() {
        String gatewayBaseUrl = "http://localhost:8080";
        log.info("Swagger UI available at: {}/swagger-ui.html", gatewayBaseUrl);
        log.info("OpenAPI JSON available at: {}/v3/api-docs", gatewayBaseUrl);
        
        Server server = new Server();
        server.setUrl(gatewayBaseUrl);
        server.setDescription("Backend Server");

        Contact contact = new Contact();
        contact.setName("HCMUS Team");
        contact.setEmail("nhannguyentrong355@gmail.com");
        contact.setUrl("https://github.com/Nhannguyenus24/Refactoring-and-Enhancing-the-Student-Alumni-System-for-HCMUS");

        License license = new License()
                .name("MIT License")
                .url("https://opensource.org/licenses/MIT");

        Info info = new Info()
                .title("API DOCUMENTATION")
                .version("1.0.0")
                .description("API documentation for the Student Alumni System")
                .contact(contact)
                .license(license);

        // Define security scheme for JWT Bearer token
        SecurityScheme securityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("Enter JWT Bearer token (without 'Bearer ' prefix)");

        // Create security requirement to apply to all endpoints
        SecurityRequirement securityRequirement = new SecurityRequirement().addList("bearerAuth");

        return new OpenAPI()
                .info(info)
                .servers(List.of(server))
                .addSecurityItem(securityRequirement)  // Apply security to all endpoints
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", securityScheme));
    }
}