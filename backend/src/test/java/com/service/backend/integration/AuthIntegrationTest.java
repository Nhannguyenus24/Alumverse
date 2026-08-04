package com.service.backend.integration;

import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.auth.dto.RegisterRequest;
import com.service.backend.shared.enums.Status;
import com.service.backend.auth.dao.AuthRepository;
import com.service.backend.shared.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.r2dbc.core.DatabaseClient;
import reactor.core.publisher.Mono;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.internal.verification.VerificationModeFactory.times;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AuthIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AuthRepository authRepository;

    @Autowired
    private DatabaseClient databaseClient;

    private static final String TEST_PASSWORD = "StrongPassword123!";
    
    private String randomIp() {
        return UUID.randomUUID().toString();
    }

    @BeforeEach
    void setUpMocks() {
        when(emailService.sendHtmlEmail(anyString(), anyString(), anyString(), any())).thenReturn(Mono.empty());
    }

    // TC01
    @Test
    @Order(1)
    void register_TC01_Success() {
        RegisterRequest request = new RegisterRequest();
        request.setOrganizationId(1);
        request.setEmail("tc01@example.com");
        request.setFullName("TC01 User");
        request.setPassword(TEST_PASSWORD);

        webTestClient.post().uri("/api/auth/register")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated();
    }

    // TC02
    @Test
    @Order(2)
    void register_TC02_MissingEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setOrganizationId(1);
        request.setFullName("TC02 User");
        request.setPassword(TEST_PASSWORD);

        webTestClient.post().uri("/api/auth/register")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isBadRequest();
    }

    // TC03
    @Test
    @Order(3)
    void register_TC03_InvalidEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setOrganizationId(1);
        request.setEmail("invalid-email");
        request.setFullName("TC03 User");
        request.setPassword(TEST_PASSWORD);

        webTestClient.post().uri("/api/auth/register")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isBadRequest();
    }

    // TC04
    @Test
    @Order(4)
    void register_TC04_WeakPassword() {
        RegisterRequest request = new RegisterRequest();
        request.setOrganizationId(1);
        request.setEmail("tc04@example.com");
        request.setFullName("TC04 User");
        request.setPassword("123");

        webTestClient.post().uri("/api/auth/register")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isBadRequest();
    }

    // TC05
    @Test
    @Order(5)
    void register_TC05_EmailExists() {
        // Prepare existing user
        RegisterRequest request1 = new RegisterRequest();
        request1.setOrganizationId(1);
        request1.setEmail("tc05@example.com");
        request1.setFullName("TC05 User");
        request1.setPassword(TEST_PASSWORD);

        webTestClient.post().uri("/api/auth/register")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request1)
                .exchange()
                .expectStatus().isCreated();

        // Register again
        webTestClient.post().uri("/api/auth/register")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request1)
                .exchange()
                .expectStatus().isEqualTo(409); 
    }

    // TC06
    @Test
    @Order(6)
    void register_TC06_MissingName() {
        RegisterRequest request = new RegisterRequest();
        request.setOrganizationId(1);
        request.setEmail("tc06@example.com");
        request.setFullName("");
        request.setPassword(TEST_PASSWORD);

        webTestClient.post().uri("/api/auth/register")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isBadRequest();
    }

    // TC07
    @Test
    @Order(7)
    void register_TC07_OtpSent() {
        RegisterRequest request = new RegisterRequest();
        request.setOrganizationId(1);
        request.setEmail("tc07@example.com");
        request.setFullName("TC07 User");
        request.setPassword(TEST_PASSWORD);

        webTestClient.post().uri("/api/auth/register")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated();
                
        verify(emailService, times(1)).sendHtmlEmail(anyString(), anyString(), anyString(), any()); // TC07 called this
    }

    // Prepare helper for Login Tests
    private void prepareUserForLogin(String email, String status) {
        RegisterRequest request = new RegisterRequest();
        request.setOrganizationId(1);
        request.setEmail(email);
        request.setFullName("User " + email);
        request.setPassword(TEST_PASSWORD);

        webTestClient.post().uri("/api/auth/register")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated();
                
        databaseClient.sql("UPDATE users SET status = :status WHERE email = :email")
                .bind("status", status)
                .bind("email", email)
                .then().block();
    }

    // TC08
    @Test
    @Order(8)
    void login_TC08_Success() {
        prepareUserForLogin("tc08@example.com", "ACTIVE");

        LoginRequest request = new LoginRequest();
        request.setOrganizationId(1);
        request.setEmail("tc08@example.com");
        request.setPassword(TEST_PASSWORD);

        webTestClient.post().uri("/api/auth/login")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk();
    }

    // TC09
    @Test
    @Order(9)
    void login_TC09_WrongPassword() {
        prepareUserForLogin("tc09@example.com", "ACTIVE");

        LoginRequest request = new LoginRequest();
        request.setOrganizationId(1);
        request.setEmail("tc09@example.com");
        request.setPassword("WrongPassword123!");

        webTestClient.post().uri("/api/auth/login")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isUnauthorized();
    }

    // TC10
    @Test
    @Order(10)
    void login_TC10_WrongEmail() {
        LoginRequest request = new LoginRequest();
        request.setOrganizationId(1);
        request.setEmail("not.found@example.com");
        request.setPassword(TEST_PASSWORD);

        webTestClient.post().uri("/api/auth/login")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isNotFound(); // System returns 404
    }

    // TC11
    @Test
    @Order(11)
    void login_TC11_Unactivated() {
        prepareUserForLogin("tc11@example.com", "UNVERIFIED"); // Actual status is UNVERIFIED

        LoginRequest request = new LoginRequest();
        request.setOrganizationId(1);
        request.setEmail("tc11@example.com");
        request.setPassword(TEST_PASSWORD);

        webTestClient.post().uri("/api/auth/login")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isUnauthorized(); // System returns 401
    }

    // TC12
    @Test
    @Order(12)
    void login_TC12_Banned() {
        prepareUserForLogin("tc12@example.com", "BANNED");

        LoginRequest request = new LoginRequest();
        request.setOrganizationId(1);
        request.setEmail("tc12@example.com");
        request.setPassword(TEST_PASSWORD);

        webTestClient.post().uri("/api/auth/login")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isUnauthorized(); // System returns 401
    }

    // TC13
    @Test
    @Order(13)
    void login_TC13_TokenFormat() {
        prepareUserForLogin("tc13@example.com", "ACTIVE");

        LoginRequest request = new LoginRequest();
        request.setOrganizationId(1);
        request.setEmail("tc13@example.com");
        request.setPassword(TEST_PASSWORD);

        webTestClient.post().uri("/api/auth/login")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueMatches(org.springframework.http.HttpHeaders.SET_COOKIE, ".*refreshToken=.*")
                .expectBody()
                .jsonPath("$.data.accessToken").value(org.hamcrest.Matchers.matchesPattern("^[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$"));
    }
}
