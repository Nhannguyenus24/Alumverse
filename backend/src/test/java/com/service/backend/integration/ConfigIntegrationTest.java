package com.service.backend.integration;

import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.shared.controller.FileUploadController;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.Map;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ConfigIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;
    
    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private static String userToken;
    private static Long userId;
    private static Integer testOrganizationId;
    private static boolean dbInitialized = false;
    private static final String TEST_PASSWORD = "Password123!";

    private Long prepareUser(String email, String fullName) {
        String hash = passwordEncoder.encode(TEST_PASSWORD);
        databaseClient.sql("INSERT INTO users (email, password_hash, status, role, full_name, must_change_password) " +
                "VALUES (:email, :hash, 'ACTIVE', 'USER', :fullName, false) " +
                "ON CONFLICT (email) DO NOTHING")
                .bind("email", email)
                .bind("hash", hash)
                .bind("fullName", fullName)
                .then().block();

        Long newUserId = databaseClient.sql("SELECT id FROM users WHERE email = :email")
                .bind("email", email)
                .map((row, metadata) -> ((Number) row.get("id")).longValue())
                .one()
                .block();

        databaseClient.sql("INSERT INTO organization_members (organization_id, user_id, verification_level) " +
                "VALUES (:orgId, :userId, 4) ON CONFLICT DO NOTHING")
                .bind("orgId", testOrganizationId)
                .bind("userId", newUserId)
                .then().block();

        return newUserId;
    }

    private String getValidAccessToken(String email) {
        LoginRequest request = new LoginRequest();
        request.setOrganizationId(testOrganizationId);
        request.setEmail(email);
        request.setPassword(TEST_PASSWORD);

        Map<String, Object> response = webTestClient.post().uri("/api/auth/login")
                .header("X-Forwarded-For", "127.0.0.1")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Map<String, Object> data = (Map<String, Object>) response.get("data");
        return (String) data.get("accessToken");
    }

    @org.junit.jupiter.api.BeforeEach
    void setup() {
        if (!dbInitialized) {
            testOrganizationId = databaseClient.sql("SELECT id FROM organizations LIMIT 1")
                .fetch().first().map(m -> ((Number) m.get("id")).intValue()).block();

            userId = prepareUser("config_user@test.com", "Config User");
            userToken = getValidAccessToken("config_user@test.com");

            dbInitialized = true;
        }
    }

    @Test
    @Order(1)
    void getHealth_success() {
        webTestClient.get()
                .uri("/health")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.status").isEqualTo("UP");
    }

    @Test
    @Order(2)
    void getSseConnect_success() {
        // Just expect it to connect and possibly stream. We can just test that it doesn't return 401.
        webTestClient.get()
                .uri("/api/sse/connect?token=" + userToken)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .exchange()
                .expectStatus().isOk();
    }
}
