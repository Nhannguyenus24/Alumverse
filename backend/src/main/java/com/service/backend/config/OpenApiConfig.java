package com.service.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

@Configuration
public class OpenApiConfig {
    private final String gatewayBaseUrl = "http://localhost:8080";

    @Bean
    public OpenAPI customOpenAPI() {
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

        return new OpenAPI()
                .info(info)
                .servers(List.of(server))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", securityScheme));
    }
}