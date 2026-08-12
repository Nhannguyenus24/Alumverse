package com.service.backend.integration;

import com.service.backend.auth.dto.LoginRequest;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.http.MediaType;

import java.util.Map;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AdminIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;
    
    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private static String adminToken;
    private static Long adminUserId;
    private static Integer testOrganizationId;
    private static boolean dbInitialized = false;
    private static final String TEST_PASSWORD = "Password123!";

    private Long prepareAdminUser(String email, String fullName) {
        String hash = passwordEncoder.encode(TEST_PASSWORD);
        databaseClient.sql("INSERT INTO users (email, password_hash, status, role, full_name, must_change_password) " +
                "VALUES (:email, :hash, 'ACTIVE', 'ADMIN', :fullName, false) " +
                "ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', status = 'ACTIVE'")
                .bind("email", email)
                .bind("hash", hash)
                .bind("fullName", fullName)
                .then().block();

        return databaseClient.sql("SELECT id FROM users WHERE email = :email")
                .bind("email", email)
                .map((row, metadata) -> ((Number) row.get("id")).longValue())
                .one()
                .block();
    }

    private String getValidAccessToken(String email) {
        LoginRequest request = new LoginRequest();
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

            adminUserId = prepareAdminUser("admin_test@test.com", "Admin User");
            adminToken = getValidAccessToken("admin_test@test.com");

            dbInitialized = true;
        }
    }

    @Test
    @Order(1)
    void getLoginHistories_success() {
        webTestClient.get()
                .uri("/api/admin/audit/login-history")
                .header("Authorization", "Bearer " + adminToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(2)
    void getLoginHistoriesByUser_success() {
        webTestClient.get()
                .uri("/api/admin/audit/login-history/user/" + adminUserId)
                .header("Authorization", "Bearer " + adminToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(3)
    void getLoginStats_success() {
        webTestClient.get()
                .uri("/api/admin/audit/login-history/stats")
                .header("Authorization", "Bearer " + adminToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data").isNotEmpty();
    }

    @Test
    @Order(4)
    void getSuspiciousLogins_success() {
        webTestClient.get()
                .uri("/api/admin/audit/login-history/suspicious")
                .header("Authorization", "Bearer " + adminToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data").isArray();
    }

    @Test
    @Order(5)
    void getAdminActions_success() {
        webTestClient.get()
                .uri("/api/admin/audit/actions")
                .header("Authorization", "Bearer " + adminToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(6)
    void getAdminActionFacets_success() {
        webTestClient.get()
                .uri("/api/admin/audit/actions/facets")
                .header("Authorization", "Bearer " + adminToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data").isNotEmpty();
    }

    @Test
    @Order(7)
    void getAdminActionSummary_success() {
        webTestClient.get()
                .uri("/api/admin/audit/actions/summary")
                .header("Authorization", "Bearer " + adminToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data").isArray();
    }
}
