package com.service.backend.integration;

import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.article.dto.CreateAchievementRequest;
import com.service.backend.article.dto.UpdateAchievementRequest;
import com.service.backend.shared.enums.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AchievementIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String TEST_PASSWORD = "Password123!";
    private static boolean dbInitialized = false;

    @BeforeEach
    void setup() {
        if (!dbInitialized) {
            databaseClient.sql("DELETE FROM achievements").then().block();
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
    // Achievement Module Tests (TC49 - TC54)
    // =========================================================================

    @Test
    @Order(49)
    void createAchievement_TC49_SuccessForAdmin() {
        String token = getValidAccessToken("admin_achieve_tc49@example.com", "ADMIN");

        CreateAchievementRequest request = CreateAchievementRequest.builder()
                .topic("student_honor")
                .organizationId(1)
                .title("Top Performer " + UUID.randomUUID())
                .description("Awarded for excellent performance.")
                .awardedDate(LocalDate.now())
                .status(Status.APPROVED)
                .build();

        webTestClient.post().uri("/api/articles/achievements")
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
    @Order(50)
    void createAchievement_TC50_SuccessForUserButPending() {
        String token = getValidAccessToken("user_achieve_tc50@example.com", "USER");

        CreateAchievementRequest request = CreateAchievementRequest.builder()
                .topic("student_honor")
                .organizationId(1)
                .title("Best Innovation " + UUID.randomUUID())
                .description("Innovation award.")
                .awardedDate(LocalDate.now())
                .build();

        webTestClient.post().uri("/api/articles/achievements")
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
    @Order(51)
    void getAchievementList_TC51_Success() {
        String token = getValidAccessToken("admin_achieve_tc51@example.com", "ADMIN");

        webTestClient.get().uri("/api/articles/achievements?organizationId=1&page=0&limit=10")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(52)
    void updateAchievement_TC52_Success() {
        String token = getValidAccessToken("admin_achieve_tc52@example.com", "ADMIN");

        CreateAchievementRequest request = CreateAchievementRequest.builder()
                .topic("student_honor")
                .organizationId(1)
                .title("Old Achievement Title")
                .description("Old Desc")
                .status(Status.APPROVED)
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/achievements")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer achievementId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        UpdateAchievementRequest updateReq = UpdateAchievementRequest.builder()
                .title("New Achievement Title")
                .description("New Desc")
                .build();

        webTestClient.put().uri("/api/articles/achievements/" + achievementId)
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateReq)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.title").isEqualTo("New Achievement Title");
    }

    @Test
    @Order(53)
    void deleteAchievement_TC53_Success() {
        String token = getValidAccessToken("admin_achieve_tc53@example.com", "ADMIN");

        CreateAchievementRequest request = CreateAchievementRequest.builder()
                .topic("student_honor")
                .organizationId(1)
                .title("Achievement to Delete")
                .description("Desc")
                .status(Status.APPROVED)
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/achievements")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer achievementId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        webTestClient.delete().uri("/api/articles/achievements/" + achievementId)
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk();

        // Verify deleted
        webTestClient.get().uri("/api/articles/achievements/" + achievementId + "?organizationId=1")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    @Order(54)
    void approveAndRejectAchievement_TC54_Success() {
        String adminToken = getValidAccessToken("admin_achieve_tc54@example.com", "ADMIN");
        String userToken = getValidAccessToken("user_achieve_tc54@example.com", "USER");

        // User creates pending achievement
        CreateAchievementRequest request = CreateAchievementRequest.builder()
                .topic("student_honor")
                .organizationId(1)
                .title("Pending Achievement")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/achievements")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer achievementId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        // Admin approves
        webTestClient.post().uri("/api/admin/articles/achievements/" + achievementId + "/approve")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + adminToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.status").isEqualTo("APPROVED");

        // Admin rejects (changes to PENDING)
        webTestClient.post().uri("/api/admin/articles/achievements/" + achievementId + "/reject")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + adminToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.status").isEqualTo("PENDING");
    }
}
