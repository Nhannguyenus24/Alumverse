package com.service.backend.integration;

import com.service.backend.organization.dto.CreateSchoolFeedbackRequest;

import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.r2dbc.core.DatabaseClient;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class OrganizationIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;

    private static Integer testOrganizationId;
    private static String testOrganizationSlug;
    private static boolean dbInitialized = false;

    @org.junit.jupiter.api.BeforeEach
    void setup() {
        if (!dbInitialized) {
            // Get an organization ID and slug
            testOrganizationId = databaseClient.sql("SELECT id FROM organizations LIMIT 1")
                .fetch().first().map(m -> ((Number) m.get("id")).intValue()).block();
                
            testOrganizationSlug = databaseClient.sql("SELECT slug FROM organizations LIMIT 1")
                .fetch().first().map(m -> (String) m.get("slug")).block();

            dbInitialized = true;
        }
    }

    @Test
    @Order(1)
    void getOrganizations_success() {
        webTestClient.get()
                .uri("/api/organizations")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data").isArray()
                .jsonPath("$.data[0].id").isNotEmpty();
    }

    @Test
    @Order(2)
    void getOrganizationBySlug_success() {
        webTestClient.get()
                .uri("/api/organizations/" + testOrganizationSlug)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.id").isEqualTo(testOrganizationId)
                .jsonPath("$.data.slug").isEqualTo(testOrganizationSlug);
    }

    @Test
    @Order(3)
    void getOrganizationIntroduction_success() {
        // Just expect it to return ok. We don't check details as it may be empty.
        webTestClient.get()
                .uri("/api/organizations/" + testOrganizationId + "/introduction")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data").isNotEmpty();
    }

    @Test
    @Order(4)
    void submitFeedback_success() {
        CreateSchoolFeedbackRequest request = new CreateSchoolFeedbackRequest();
        request.setFullName("John Doe");
        request.setPhone("0123456789");
        request.setEmail("john.doe@example.com");
        request.setSubject("Test Subject");
        request.setContent("Test Content");

        webTestClient.post()
                .uri("/api/organizations/" + testOrganizationId + "/feedbacks")
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated() // Feedback usually creates something
                .expectBody()
                .jsonPath("$.message").isNotEmpty();
    }

    @Test
    @Order(5)
    void getTrustedVerifiers_success() {
        webTestClient.get()
                .uri("/api/organizations/" + testOrganizationId + "/trusted-verifiers")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data").isArray();
    }
}
