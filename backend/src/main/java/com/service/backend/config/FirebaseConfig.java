package com.service.backend.config;

import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;

@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.enabled:false}")
    private boolean enabled;

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    @Bean
    public FirebaseMessaging firebaseMessaging() {
        if (!enabled || credentialsPath == null || credentialsPath.isBlank()) {
            log.warn("Firebase push disabled (firebase.enabled=false or no credentials path).");
            return null;
        }
        try (InputStream credentials = openCredentials(credentialsPath)) {
            if (credentials == null) {
                log.warn("Firebase credentials not found at '{}' — push disabled.", credentialsPath);
                return null;
            }
            FirebaseApp app = FirebaseApp.getApps().isEmpty()
                    ? FirebaseApp.initializeApp(FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(credentials))
                            .build())
                    : FirebaseApp.getInstance();
            log.info("Firebase push initialized.");
            return FirebaseMessaging.getInstance(app);
        } catch (Exception e) {
            log.error("Failed to initialize Firebase — push disabled.", e);
            return null;
        }
    }

    private InputStream openCredentials(String path) throws Exception {
        Path onDisk = Paths.get(path);
        if (Files.isRegularFile(onDisk)) {
            return new FileInputStream(onDisk.toFile());
        }
        ClassPathResource cp = new ClassPathResource(path);
        return cp.exists() ? cp.getInputStream() : null;
    }
}
