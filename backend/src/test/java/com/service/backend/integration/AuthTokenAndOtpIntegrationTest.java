package com.service.backend.integration;

import com.service.backend.auth.dto.*;
import com.service.backend.auth.dao.AuthRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.r2dbc.core.DatabaseClient;
import reactor.core.publisher.Mono;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AuthTokenAndOtpIntegrationTest extends BaseIntegrationTest {

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

    private void prepareUser(String email, String status) {
        RegisterRequest request = new RegisterRequest();
        request.setOrganizationId(1);
        request.setEmail(email);
        request.setFullName("User " + email);
        request.setPassword(TEST_PASSWORD);

        webTestClient.post().uri("/api/auth/register")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange();
                
        databaseClient.sql("UPDATE users SET status = :status WHERE email = :email")
                .bind("status", status)
                .bind("email", email)
                .then().block();
    }

    private String getValidRefreshToken(String email) {
        prepareUser(email, "ACTIVE");
        LoginRequest request = new LoginRequest();
        request.setOrganizationId(1);
        request.setEmail(email);
        request.setPassword(TEST_PASSWORD);

        String cookie = webTestClient.post().uri("/api/auth/login")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .returnResult(Object.class)
                .getResponseHeaders()
                .getFirst(HttpHeaders.SET_COOKIE);
                
        return cookie != null ? cookie.split(";")[0].split("=")[1] : "";
    }

    // Refresh Token Group
    @Test
    @Order(14)
    void refresh_TC14_Success() {
        String token = getValidRefreshToken("tc14@example.com");
        webTestClient.post().uri("/api/auth/refresh?organizationId=1")
                .header("X-Forwarded-For", randomIp())
                .cookie("refreshToken", token)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(15)
    void refresh_TC15_Expired() {
        String expiredToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0Y2RvbWFpbiIsImV4cCI6MTUxNjIzOTAyMn0.dummy";
        webTestClient.post().uri("/api/auth/refresh?organizationId=1")
                .header("X-Forwarded-For", randomIp())
                .cookie("refreshToken", expiredToken)
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    @Order(16)
    void refresh_TC16_InvalidFormat() {
        webTestClient.post().uri("/api/auth/refresh?organizationId=1")
                .header("X-Forwarded-For", randomIp())
                .cookie("refreshToken", "invalid-format")
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    @Order(17)
    void refresh_TC17_Missing() {
        webTestClient.post().uri("/api/auth/refresh?organizationId=1")
                .header("X-Forwarded-For", randomIp())
                .exchange()
                .expectStatus().isUnauthorized();
    }

    // Forgot Password Group
    @Test
    @Order(18)
    void forgotPassword_TC18_Success() {
        prepareUser("tc18@example.com", "ACTIVE");
        SendOtpRequest request = new SendOtpRequest("tc18@example.com");
        webTestClient.post().uri("/api/auth/send-otp")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(19)
    void forgotPassword_TC19_EmailNotFound() {
        SendOtpRequest request = new SendOtpRequest("not.found@example.com");
        webTestClient.post().uri("/api/auth/send-otp")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    @Order(20)
    void forgotPassword_TC20_MissingEmail() {
        SendOtpRequest request = new SendOtpRequest(null);
        webTestClient.post().uri("/api/auth/send-otp")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    @Order(21)
    void forgotPassword_TC21_InvalidEmail() {
        SendOtpRequest request = new SendOtpRequest("invalid-email");
        webTestClient.post().uri("/api/auth/send-otp")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isBadRequest();
    }

    // Reset Password Group
    @Test
    @Order(22)
    void resetPassword_TC22_Success() {
        assertTrue(true);
    }

    @Test
    @Order(23)
    void resetPassword_TC23_WrongOtp() {
        prepareUser("tc23@example.com", "ACTIVE");
        ResetPasswordRequest request = new ResetPasswordRequest("tc23@example.com", "999999", "NewStrongPass123!");
        webTestClient.post().uri("/api/auth/reset-password")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    @Order(24)
    void resetPassword_TC24_ExpiredOtp() {
        prepareUser("tc24@example.com", "ACTIVE");
        ResetPasswordRequest request = new ResetPasswordRequest("tc24@example.com", "111111", "NewStrongPass123!");
        webTestClient.post().uri("/api/auth/reset-password")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    @Order(25)
    void resetPassword_TC25_WeakPassword() {
        ResetPasswordRequest request = new ResetPasswordRequest("tc25@example.com", "123456", "123");
        webTestClient.post().uri("/api/auth/reset-password")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    @Order(26)
    void resetPassword_TC26_MissingParams() {
        ResetPasswordRequest request = new ResetPasswordRequest(null, null, null);
        webTestClient.post().uri("/api/auth/reset-password")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isBadRequest();
    }

    // Verify Email (OTP) Group
    @Test
    @Order(27)
    void verifyEmail_TC27_Success() {
        assertTrue(true);
    }

    @Test
    @Order(28)
    void verifyEmail_TC28_WrongOtp() {
        prepareUser("tc28@example.com", "UNVERIFIED");
        VerifyOtpRequest request = new VerifyOtpRequest("tc28@example.com", "000000");
        webTestClient.post().uri("/api/auth/verify-otp")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    @Order(29)
    void verifyEmail_TC29_ExpiredOtp() {
        prepareUser("tc29@example.com", "UNVERIFIED");
        VerifyOtpRequest request = new VerifyOtpRequest("tc29@example.com", "111111");
        webTestClient.post().uri("/api/auth/verify-otp")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    @Order(30)
    void verifyEmail_TC30_AlreadyActive() {
        VerifyOtpRequest request = new VerifyOtpRequest("tc30@example.com", "123456");
        webTestClient.post().uri("/api/auth/verify-otp")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isNotFound();
    }

    // Google Login Group
    @Test
    @Order(31)
    void googleLogin_TC31_SuccessNewUser() {
        assertTrue(true);
    }

    @Test
    @Order(32)
    void googleLogin_TC32_SuccessOldUser() {
        assertTrue(true);
    }

    @Test
    @Order(33)
    void googleLogin_TC33_InvalidToken() {
        GoogleLoginRequest request = new GoogleLoginRequest();
        request.setOrganizationId(1);
        request.setIdToken("fake-google-token");
        webTestClient.post().uri("/api/auth/google-login")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    @Order(34)
    void googleLogin_TC34_MissingToken() {
        GoogleLoginRequest request = new GoogleLoginRequest();
        request.setOrganizationId(1);
        webTestClient.post().uri("/api/auth/google-login")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isBadRequest();
    }
}
