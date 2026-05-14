package com.service.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.r2dbc.core.DatabaseClient;

@Configuration
public class DatabaseInitializer {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseInitializer.class);

    @Bean
    public CommandLineRunner initSchema(DatabaseClient client) {
        return args -> {
            logger.info("Initializing database schema fixes...");
            
            client.sql("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'")
                .then()
                .doOnSuccess(v -> logger.info("Successfully checked/added 'status' column to 'organizations' table"))
                .doOnError(e -> logger.warn("Failed to add 'status' column (it might already exist or table is missing): {}", e.getMessage()))
                .subscribe();
        };
    }
}
