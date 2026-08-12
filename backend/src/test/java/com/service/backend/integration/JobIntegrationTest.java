package com.service.backend.integration;

import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.article.dto.CreateJobRequest;
import com.service.backend.article.dto.UpdateJobRequest;
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
public class JobIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String TEST_PASSWORD = "Password123!";
    private static boolean dbInitialized = false;

    @BeforeEach
    void setup() {
        if (!dbInitialized) {
            databaseClient.sql("DELETE FROM jobs").then().block();
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
    // Job Module Tests (TC32 - TC41)
    // =========================================================================

    @Test
    @Order(32)
    void createJob_TC32_SuccessForAdmin() {
        String token = getValidAccessToken("admin_job_tc32@example.com", "ADMIN");

        CreateJobRequest request = CreateJobRequest.builder()
                .organizationId(1)
                .title("Software Engineer " + UUID.randomUUID())
                .description("Job Description")
                .companyName("Tech Corp")
                .location("Ho Chi Minh City")
                .type("FULL_TIME")
                .salaryRange("1000-2000")
                .deadline(LocalDate.now().plusDays(30))
                .isReferral(false)
                .build();

        webTestClient.post().uri("/api/articles/jobs")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.id").isNotEmpty()
                .jsonPath("$.data.isActive").isEqualTo(true);
    }

    @Test
    @Order(33)
    void createJob_TC33_SuccessForUserButInactive() {
        String token = getValidAccessToken("user_job_tc33@example.com", "USER");

        CreateJobRequest request = CreateJobRequest.builder()
                .organizationId(1)
                .title("Data Analyst " + UUID.randomUUID())
                .description("Data Job Description")
                .companyName("Data Inc")
                .type("PART_TIME")
                .deadline(LocalDate.now().plusDays(15))
                .build();

        webTestClient.post().uri("/api/articles/jobs")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.isActive").isEqualTo(false);
    }

    @Test
    @Order(34)
    void getJobList_TC34_Success() {
        String token = getValidAccessToken("admin_job_tc34@example.com", "ADMIN");

        webTestClient.get().uri("/api/articles/jobs?organizationId=1&page=0&limit=10")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(35)
    void getJobById_TC35_Success() {
        String token = getValidAccessToken("admin_job_tc35@example.com", "ADMIN");

        CreateJobRequest request = CreateJobRequest.builder()
                .organizationId(1)
                .title("Unique Job " + UUID.randomUUID())
                .description("Description")
                .type("INTERNSHIP")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/jobs")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer jobId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        webTestClient.get().uri("/api/articles/jobs/" + jobId + "?organizationId=1")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.id").isEqualTo(jobId);
    }

    @Test
    @Order(36)
    void updateJob_TC36_Success() {
        String token = getValidAccessToken("admin_job_tc36@example.com", "ADMIN");

        CreateJobRequest request = CreateJobRequest.builder()
                .organizationId(1)
                .title("Old Title")
                .description("Old Desc")
                .type("FULL_TIME")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/jobs")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer jobId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        UpdateJobRequest updateReq = UpdateJobRequest.builder()
                .title("New Title")
                .description("New Desc")
                .type("FULL_TIME")
                .build();

        webTestClient.put().uri("/api/articles/jobs/" + jobId)
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateReq)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.title").isEqualTo("New Title");
    }

    @Test
    @Order(37)
    void deleteJob_TC37_Success() {
        String token = getValidAccessToken("admin_job_tc37@example.com", "ADMIN");

        CreateJobRequest request = CreateJobRequest.builder()
                .organizationId(1)
                .title("Job to delete")
                .description("Desc")
                .type("FULL_TIME")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/jobs")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer jobId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        webTestClient.delete().uri("/api/articles/jobs/" + jobId)
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk();

        // Verify deleted
        webTestClient.get().uri("/api/articles/jobs/" + jobId + "?organizationId=1")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    @Order(38)
    void activateJob_TC38_Success() {
        String token = getValidAccessToken("admin_job_tc38@example.com", "ADMIN");
        String userToken = getValidAccessToken("user_job_tc38@example.com", "USER");

        // User creates inactive job
        CreateJobRequest request = CreateJobRequest.builder()
                .organizationId(1)
                .title("Inactive Job")
                .type("FULL_TIME")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/jobs")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer jobId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        // Admin activates
        webTestClient.post().uri("/api/articles/jobs/" + jobId + "/activate")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.isActive").isEqualTo(true);
    }

    @Test
    @Order(39)
    void deactivateJob_TC39_Success() {
        String token = getValidAccessToken("admin_job_tc39@example.com", "ADMIN");

        CreateJobRequest request = CreateJobRequest.builder()
                .organizationId(1)
                .title("Active Job to Deactivate")
                .type("FULL_TIME")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/jobs")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer jobId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        webTestClient.post().uri("/api/articles/jobs/" + jobId + "/deactivate")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.isActive").isEqualTo(false);
    }

    @Test
    @Order(40)
    void getOpenJobs_TC40_Success() {
        String token = getValidAccessToken("user_job_tc40@example.com", "USER");

        webTestClient.get().uri("/api/articles/jobs/open?page=0&limit=10")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }
    
    @Test
    @Order(41)
    void searchJobs_TC41_Success() {
        String token = getValidAccessToken("user_job_tc41@example.com", "USER");

        webTestClient.get().uri("/api/articles/jobs/search?keyword=test&organizationId=1&page=0&limit=10")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }
}
