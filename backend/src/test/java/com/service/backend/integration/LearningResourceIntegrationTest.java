package com.service.backend.integration;

import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.article.dto.CreateLearningResourceRequest;
import com.service.backend.article.dto.UpdateLearningResourceRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.UUID;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class LearningResourceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String TEST_PASSWORD = "Password123!";
    private static boolean dbInitialized = false;

    @BeforeEach
    void setup() {
        if (!dbInitialized) {
            databaseClient.sql("DELETE FROM learning_resources").then().block();
            dbInitialized = true;
        }
    }

    private String randomIp() {
        return "192.168.1." + (int) (Math.random() * 255);
    }

    private Long prepareUser(String email, String role) {
        String hash = passwordEncoder.encode(TEST_PASSWORD);
        databaseClient.sql("INSERT INTO users (email, password_hash, status, role, full_name, must_change_password) " +
                "VALUES (:email, :hash, 'ACTIVE', :role, :fullName, false) " +
                "ON CONFLICT (email) DO NOTHING")
                .bind("email", email)
                .bind("hash", hash)
                .bind("role", role)
                .bind("fullName", "User " + email)
                .then().block();

        Long userId = databaseClient.sql("SELECT id FROM users WHERE email = :email")
                .bind("email", email)
                .map((row, metadata) -> row.get("id", Integer.class).longValue())
                .one()
                .block();

        databaseClient.sql("INSERT INTO organization_members (organization_id, user_id, verification_level) " +
                "VALUES (1, :userId, 4) ON CONFLICT DO NOTHING")
                .bind("userId", userId)
                .then().block();

        return userId;
    }

    private String getValidAccessToken(String email, String role) {
        prepareUser(email, role);
        LoginRequest request = new LoginRequest();
        request.setOrganizationId(1);
        request.setEmail(email);
        request.setPassword(TEST_PASSWORD);

        Map<String, Object> response = webTestClient.post().uri("/api/auth/login")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        if (response != null && response.get("data") != null) {
            Map<String, Object> data = (Map<String, Object>) response.get("data");
            return (String) data.get("accessToken");
        }
        throw new RuntimeException("Failed to get access token");
    }

    // =========================================================================
    // Learning Resource Module Tests (TC42 - TC48)
    // =========================================================================

    @Test
    @Order(42)
    void createLearningResource_TC42_SuccessForAdmin() {
        String token = getValidAccessToken("admin_lr_tc42@example.com", "ADMIN");

        CreateLearningResourceRequest request = CreateLearningResourceRequest.builder()
                .organizationId(1)
                .title("Advanced Java Programming " + UUID.randomUUID())
                .type("online_course")
                .linkUrl("https://example.com/java-course")
                .description("A comprehensive guide to advanced Java concepts.")
                .build();

        webTestClient.post().uri("/api/articles/learning-resources")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.id").isNotEmpty()
                .jsonPath("$.data.status").isEqualTo("APPROVED");
    }

    @Test
    @Order(43)
    void createLearningResource_TC43_SuccessForUserButPending() {
        String token = getValidAccessToken("user_lr_tc43@example.com", "USER");

        CreateLearningResourceRequest request = CreateLearningResourceRequest.builder()
                .organizationId(1)
                .title("Spring Boot for Beginners " + UUID.randomUUID())
                .type("online_course")
                .linkUrl("https://example.com/spring-boot")
                .description("Learn Spring Boot from scratch.")
                .build();

        webTestClient.post().uri("/api/articles/learning-resources")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.status").isEqualTo("PENDING");
    }

    @Test
    @Order(44)
    void getLearningResourceList_TC44_Success() {
        String token = getValidAccessToken("admin_lr_tc44@example.com", "ADMIN");

        webTestClient.get().uri("/api/articles/learning-resources?organizationId=1&page=0&limit=10")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(45)
    void getLearningResourceById_TC45_Success() {
        String token = getValidAccessToken("admin_lr_tc45@example.com", "ADMIN");

        CreateLearningResourceRequest request = CreateLearningResourceRequest.builder()
                .organizationId(1)
                .title("Resource to Get " + UUID.randomUUID())
                .type("online_course")
                .linkUrl("https://example.com/article")
                .description("Description")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/learning-resources")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer resourceId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        webTestClient.get().uri("/api/articles/learning-resources/" + resourceId + "?organizationId=1")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.id").isEqualTo(resourceId);
    }

    @Test
    @Order(46)
    void updateLearningResource_TC46_Success() {
        String token = getValidAccessToken("admin_lr_tc46@example.com", "ADMIN");

        CreateLearningResourceRequest request = CreateLearningResourceRequest.builder()
                .organizationId(1)
                .title("Old Resource Title")
                .type("online_course")
                .linkUrl("https://example.com/book")
                .description("Old Desc")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/learning-resources")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer resourceId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        UpdateLearningResourceRequest updateReq = UpdateLearningResourceRequest.builder()
                .title("New Resource Title")
                .type("online_course")
                .linkUrl("https://example.com/new-book")
                .description("New Desc")
                .build();

        webTestClient.put().uri("/api/articles/learning-resources/" + resourceId)
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateReq)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.title").isEqualTo("New Resource Title");
    }

    @Test
    @Order(47)
    void deleteLearningResource_TC47_Success() {
        String token = getValidAccessToken("admin_lr_tc47@example.com", "ADMIN");

        CreateLearningResourceRequest request = CreateLearningResourceRequest.builder()
                .organizationId(1)
                .title("Resource to Delete")
                .type("online_course")
                .linkUrl("https://example.com/video")
                .description("Desc")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/learning-resources")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer resourceId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        webTestClient.delete().uri("/api/articles/learning-resources/" + resourceId)
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk();

        // Verify deleted
        webTestClient.get().uri("/api/articles/learning-resources/" + resourceId + "?organizationId=1")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    @Order(48)
    void approveAndRejectLearningResource_TC48_Success() {
        String adminToken = getValidAccessToken("admin_lr_tc48@example.com", "ADMIN");
        String userToken = getValidAccessToken("user_lr_tc48@example.com", "USER");

        // User creates pending resource
        CreateLearningResourceRequest request = CreateLearningResourceRequest.builder()
                .organizationId(1)
                .title("Pending Resource")
                .type("online_course")
                .linkUrl("https://example.com/pending")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/learning-resources")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer resourceId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        // Admin approves
        webTestClient.post().uri("/api/admin/articles/learning-resources/" + resourceId + "/approve")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + adminToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.status").isEqualTo("APPROVED");

        // Admin rejects (changes to PENDING)
        webTestClient.post().uri("/api/admin/articles/learning-resources/" + resourceId + "/reject")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + adminToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.status").isEqualTo("PENDING");
    }
}
