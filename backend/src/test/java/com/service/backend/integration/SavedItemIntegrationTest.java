package com.service.backend.integration;

import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.article.dto.SaveItemRequest;
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

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class SavedItemIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String TEST_PASSWORD = "Password123!";
    private static boolean dbInitialized = false;

    @BeforeEach
    void setup() {
        if (!dbInitialized) {
            databaseClient.sql("DELETE FROM saved_items").then().block();
            dbInitialized = true;
        }
    }

    private String randomIp() {
        return "192.168.1." + (int) (Math.random() * 255);
    }

    private Long prepareUser(String email) {
        String hash = passwordEncoder.encode(TEST_PASSWORD);
        databaseClient.sql("INSERT INTO users (email, password_hash, status, role, full_name, must_change_password) " +
                "VALUES (:email, :hash, 'ACTIVE', 'USER', :fullName, false) " +
                "ON CONFLICT (email) DO NOTHING")
                .bind("email", email)
                .bind("hash", hash)
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

    private String getValidAccessToken(String email) {
        prepareUser(email);
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
    // Saved Item Module Tests (TC55 - TC59)
    // =========================================================================

    @Test
    @Order(55)
    void saveItem_TC55_Success() {
        String token = getValidAccessToken("user_save_tc55@example.com");

        SaveItemRequest request = SaveItemRequest.builder()
                .itemType("POST")
                .itemId(1001)
                .note("Read this later")
                .build();

        webTestClient.post().uri("/api/articles/saved")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.itemType").isEqualTo("POST")
                .jsonPath("$.data.itemId").isEqualTo(1001)
                .jsonPath("$.data.note").isEqualTo("Read this later");
    }

    @Test
    @Order(56)
    void saveDuplicateItem_TC56_BadRequest() {
        String token = getValidAccessToken("user_save_tc56@example.com");

        SaveItemRequest request = SaveItemRequest.builder()
                .itemType("JOB")
                .itemId(2001)
                .build();

        // First save
        webTestClient.post().uri("/api/articles/saved")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated();

        // Second save -> should fail
        webTestClient.post().uri("/api/articles/saved")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().is4xxClientError();
    }

    @Test
    @Order(57)
    void checkSavedStatus_TC57_Success() {
        String token = getValidAccessToken("user_save_tc57@example.com");

        SaveItemRequest request = SaveItemRequest.builder()
                .itemType("ARTICLE")
                .itemId(3001)
                .build();

        webTestClient.post().uri("/api/articles/saved")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated();

        // Check if saved
        webTestClient.get().uri("/api/articles/saved/check?itemType=ARTICLE&itemId=3001")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.isSaved").isEqualTo(true);

        // Check not saved
        webTestClient.get().uri("/api/articles/saved/check?itemType=ARTICLE&itemId=9999")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.isSaved").isEqualTo(false);
    }

    @Test
    @Order(58)
    void getSavedItems_TC58_Success() {
        String token = getValidAccessToken("user_save_tc58@example.com");

        // Save POST
        SaveItemRequest req1 = SaveItemRequest.builder().itemType("POST").itemId(4001).build();
        webTestClient.post().uri("/api/articles/saved")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req1)
                .exchange()
                .expectStatus().isCreated();

        // Save JOB
        SaveItemRequest req2 = SaveItemRequest.builder().itemType("JOB").itemId(5001).build();
        webTestClient.post().uri("/api/articles/saved")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req2)
                .exchange()
                .expectStatus().isCreated();

        // Get All
        webTestClient.get().uri("/api/articles/saved?page=0&limit=10")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items.length()").isEqualTo(2);

        // Get by type JOB
        webTestClient.get().uri("/api/articles/saved/type/JOB?page=0&limit=10")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items.length()").isEqualTo(1)
                .jsonPath("$.data.items[0].itemType").isEqualTo("JOB");
    }

    @Test
    @Order(59)
    void unsaveItem_TC59_Success() {
        String token = getValidAccessToken("user_save_tc59@example.com");

        SaveItemRequest request = SaveItemRequest.builder()
                .itemType("POST")
                .itemId(6001)
                .build();

        webTestClient.post().uri("/api/articles/saved")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated();

        // Unsave
        webTestClient.delete().uri("/api/articles/saved?itemType=POST&itemId=6001")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk();

        // Check if saved -> false
        webTestClient.get().uri("/api/articles/saved/check?itemType=POST&itemId=6001")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.isSaved").isEqualTo(false);
    }
}
