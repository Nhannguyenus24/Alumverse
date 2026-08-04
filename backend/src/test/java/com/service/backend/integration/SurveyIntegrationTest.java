package com.service.backend.integration;

import com.service.backend.survey.dto.SubmitSurveyRequest;
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
public class SurveyIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;
    
    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private static String userToken;
    private static Long userId;
    private static Integer testOrganizationId;
    private static Long surveyId;
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
            databaseClient.sql("DELETE FROM survey_submissions").then().block();
            databaseClient.sql("DELETE FROM survey_forms").then().block();

            testOrganizationId = databaseClient.sql("SELECT id FROM organizations LIMIT 1")
                .fetch().first().map(m -> ((Number) m.get("id")).intValue()).block();

            userId = prepareUser("survey_user@test.com", "Survey User");
            userToken = getValidAccessToken("survey_user@test.com");

            // Insert dummy survey with OPEN status and valid duration
            databaseClient.sql("INSERT INTO survey_forms (id, organization_id, creator_member_id, title, description, questions_data, start_at, duration_minutes, status, allow_multiple, created_at, updated_at) " +
                    "VALUES (1001, :orgId, :creatorId, 'Test Survey', 'Test Description', '[]'::jsonb, now() - interval '1 hour', 120, 'OPEN', true, now(), now())")
                    .bind("orgId", testOrganizationId)
                    .bind("creatorId", userId)
                    .then().block();
            
            surveyId = 1001L;

            dbInitialized = true;
        }
    }

    @Test
    @Order(1)
    void getActiveSurveys_success() {
        webTestClient.get()
                .uri("/api/surveys/active?organizationId=" + testOrganizationId)
                .header("Authorization", "Bearer " + userToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data").isArray();
    }

    @Test
    @Order(2)
    void getSurveyById_success() {
        webTestClient.get()
                .uri("/api/surveys/" + surveyId)
                .header("Authorization", "Bearer " + userToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.id").isEqualTo(surveyId.intValue());
    }

    @Test
    @Order(3)
    void submitSurvey_success() {
        SubmitSurveyRequest request = new SubmitSurveyRequest();
        request.setAnswers(Map.of("q1", "Answer 1", "q2", "Answer 2"));

        webTestClient.post()
                .uri("/api/surveys/" + surveyId + "/submit")
                .header("Authorization", "Bearer " + userToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.message").isNotEmpty();
    }

    @Test
    @Order(4)
    void getMySubmission_success() {
        webTestClient.get()
                .uri("/api/surveys/" + surveyId + "/my-submission")
                .header("Authorization", "Bearer " + userToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data").isNotEmpty();
    }
}
