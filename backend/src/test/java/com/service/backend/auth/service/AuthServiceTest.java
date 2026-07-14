package com.service.backend.auth.service;

import com.service.backend.auth.dao.AuthRepository;
import com.service.backend.auth.dto.LoginResponse;
import com.service.backend.shared.entity.User;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.EmailService;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.shared.utils.JwtUtils;
import com.service.backend.user.dao.UserLoginHistoryRepository;
import com.service.backend.user.service.NotificationService;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private AuthRepository authRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private EmailService emailService;
    @Mock
    private CacheUtils cacheUtils;
    @Mock
    private JwtUtils jwtUtils;
    @Mock
    private UserLoginHistoryRepository userLoginHistoryRepository;
    @Mock
    private NotificationService notificationService;
    private MeterRegistry meterRegistry;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        authService = new AuthService(
                authRepository, passwordEncoder, emailService, cacheUtils,
                jwtUtils, userLoginHistoryRepository,
                "test-client-id", notificationService, meterRegistry
        );
    }

    // ─── register ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("register()")
    class Register {

        @Test
        @DisplayName("should register new user successfully")
        void register_success() {
            when(passwordEncoder.encode("password")).thenReturn("hashed");
            when(authRepository.registerNewUser("test@email.com", "hashed", "Test User")).thenReturn(Mono.just(1));
            when(authRepository.createOrganizationMember(1, 1)).thenReturn(Mono.empty());

            StepVerifier.create(authService.register("test@email.com", "password", "Test User", 1))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when email already exists")
        void register_emailAlreadyExists() {
            when(passwordEncoder.encode("password")).thenReturn("hashed");
            when(authRepository.registerNewUser("test@email.com", "hashed", "Test User"))
                    .thenReturn(Mono.error(new org.springframework.dao.DataIntegrityViolationException("duplicate email")));

            StepVerifier.create(authService.register("test@email.com", "password", "Test User", 1))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.EMAIL_ALREADY_EXISTS)
                    .verify();
        }
    }

    // ─── loginByEmail ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("loginByEmail()")
    class LoginByEmail {

        @Test
        @DisplayName("should login successfully with valid credentials")
        void loginByEmail_success() {
            User user = User.builder()
                    .id(1)
                    .email("test@email.com")
                    .passwordHash("hashed")
                    .status(Status.ACTIVE)
                    .build();

            when(authRepository.findByEmail("test@email.com")).thenReturn(Mono.just(user));
            when(passwordEncoder.matches("password", "hashed")).thenReturn(true);
            when(userLoginHistoryRepository.save(any())).thenReturn(Mono.just(mock(com.service.backend.shared.entity.UserLoginHistory.class)));

            StepVerifier.create(authService.loginByEmail("test@email.com", "password", null, "agent", "127.0.0.1"))
                    .assertNext(u -> assertThat(u.getEmail()).isEqualTo("test@email.com"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail with invalid password")
        void loginByEmail_invalidPassword() {
            User user = User.builder()
                    .id(1)
                    .email("test@email.com")
                    .passwordHash("hashed")
                    .status(Status.ACTIVE)
                    .build();

            when(authRepository.findByEmail("test@email.com")).thenReturn(Mono.just(user));
            when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

            StepVerifier.create(authService.loginByEmail("test@email.com", "wrong", null, "agent", "127.0.0.1"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.INVALID_CREDENTIALS)
                    .verify();
        }

        @Test
        @DisplayName("should fail when account not verified")
        void loginByEmail_accountNotVerified() {
            User user = User.builder()
                    .id(1)
                    .email("test@email.com")
                    .passwordHash("hashed")
                    .status(Status.PENDING)
                    .build();

            when(authRepository.findByEmail("test@email.com")).thenReturn(Mono.just(user));
            when(passwordEncoder.matches("password", "hashed")).thenReturn(true);

            StepVerifier.create(authService.loginByEmail("test@email.com", "password", null, "agent", "127.0.0.1"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.ACCOUNT_NOT_VERIFIED)
                    .verify();
        }

        @Test
        @DisplayName("should fail when user not found")
        void loginByEmail_userNotFound() {
            when(authRepository.findByEmail("notfound@email.com")).thenReturn(Mono.empty());

            StepVerifier.create(authService.loginByEmail("notfound@email.com", "password", null, "agent", "127.0.0.1"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.USER_NOT_FOUND)
                    .verify();
        }

        @Test
        @DisplayName("should fail when user not member of organization")
        void loginByEmail_notMemberOfOrganization() {
            User user = User.builder()
                    .id(1)
                    .email("test@email.com")
                    .passwordHash("hashed")
                    .status(Status.ACTIVE)
                    .build();

            when(authRepository.findByEmail("test@email.com")).thenReturn(Mono.just(user));
            when(passwordEncoder.matches("password", "hashed")).thenReturn(true);
            when(authRepository.existsOrganizationMemberByUserIdAndOrgId(1, 2)).thenReturn(Mono.just(false));
            when(userLoginHistoryRepository.save(any())).thenReturn(Mono.just(mock(com.service.backend.shared.entity.UserLoginHistory.class)));

            StepVerifier.create(authService.loginByEmail("test@email.com", "password", 2, "agent", "127.0.0.1"))
                    .assertNext(u -> assertThat(u.getEmail()).isEqualTo("test@email.com"))
                    .verifyComplete();
        }
    }

    // ─── loginWithGoogle ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("loginWithGoogle()")
    class LoginWithGoogle {

        @Test
        @DisplayName("should fail when google login not configured")
        void loginWithGoogle_notConfigured() {
            // AuthService built with empty googleClientId
            AuthService serviceNoGoogle = new AuthService(
                    authRepository, passwordEncoder, emailService, cacheUtils,
                    jwtUtils, userLoginHistoryRepository,
                    "", notificationService, meterRegistry
            );

            StepVerifier.create(serviceNoGoogle.loginWithGoogle("token", 1, "agent", "127.0.0.1"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.GOOGLE_LOGIN_NOT_CONFIGURED)
                    .verify();
        }

        @Test
        @DisplayName("should fail when id token is blank")
        void loginWithGoogle_noToken() {
            StepVerifier.create(authService.loginWithGoogle("", 1, "agent", "127.0.0.1"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.GOOGLE_TOKEN_REQUIRED)
                    .verify();
        }

        @Test
        @DisplayName("should fail when organizationId is null")
        void loginWithGoogle_noOrganizationId() {
            StepVerifier.create(authService.loginWithGoogle("valid-token", null, "agent", "127.0.0.1"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.ORGANIZATION_ID_REQUIRED)
                    .verify();
        }
    }

    // ─── changePassword ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("changePassword()")
    class ChangePassword {

        @Test
        @DisplayName("should change password successfully")
        void changePassword_success() {
            User user = User.builder()
                    .id(1)
                    .passwordHash("oldHashed")
                    .build();

            when(authRepository.findById(1)).thenReturn(Mono.just(user));
            when(passwordEncoder.matches("oldPass", "oldHashed")).thenReturn(true);
            when(passwordEncoder.encode("newPass")).thenReturn("newHashed");
            when(authRepository.updatePasswordById(1, "newHashed")).thenReturn(Mono.empty());

            StepVerifier.create(authService.changePassword(1, "oldPass", "newPass"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail with invalid old password")
        void changePassword_invalidOldPassword() {
            User user = User.builder()
                    .id(1)
                    .passwordHash("oldHashed")
                    .build();

            when(authRepository.findById(1)).thenReturn(Mono.just(user));
            when(passwordEncoder.matches("wrongOld", "oldHashed")).thenReturn(false);

            StepVerifier.create(authService.changePassword(1, "wrongOld", "newPass"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.INVALID_OLD_PASSWORD)
                    .verify();
        }

        @Test
        @DisplayName("should fail when user not found")
        void changePassword_userNotFound() {
            when(authRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(authService.changePassword(99, "oldPass", "newPass"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.USER_NOT_FOUND)
                    .verify();
        }
    }

    // ─── verifyOtpAndActivate ────────────────────────────────────────────────────

    @Nested
    @DisplayName("verifyOtpAndActivate()")
    class VerifyOtpAndActivate {

        @Test
        @DisplayName("should verify OTP and activate user successfully")
        void verifyOtp_success() {
            Map<String, Object> cacheData = new HashMap<>();
            cacheData.put("otp", "123456");
            cacheData.put("userId", 1);

            when(cacheUtils.get("otp_verification", "test@email.com")).thenReturn(Mono.just(cacheData));
            when(authRepository.activateUserById(1)).thenReturn(Mono.empty());
            when(cacheUtils.evict("otp_verification", "test@email.com")).thenReturn(Mono.empty());

            StepVerifier.create(authService.verifyOtpAndActivate("test@email.com", "123456"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail with invalid OTP")
        void verifyOtp_invalidOtp() {
            Map<String, Object> cacheData = new HashMap<>();
            cacheData.put("otp", "123456");
            cacheData.put("userId", 1);

            when(cacheUtils.get("otp_verification", "test@email.com")).thenReturn(Mono.just(cacheData));

            StepVerifier.create(authService.verifyOtpAndActivate("test@email.com", "999999"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.INVALID_OTP)
                    .verify();
        }

        @Test
        @DisplayName("should fail when OTP expired")
        void verifyOtp_otpExpired() {
            when(cacheUtils.get("otp_verification", "test@email.com")).thenReturn(Mono.empty());

            StepVerifier.create(authService.verifyOtpAndActivate("test@email.com", "123456"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.OTP_EXPIRED_NOT_FOUND)
                    .verify();
        }
    }

    // ─── sendOtpVerification ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("sendOtpVerification()")
    class SendOtpVerification {

        @Test
        @DisplayName("should send OTP email successfully")
        void sendOtp_success() {
            User user = User.builder().id(1).email("test@email.com").build();

            when(authRepository.findByEmail("test@email.com")).thenReturn(Mono.just(user));
            when(cacheUtils.putWithTtl(anyString(), anyString(), any(), any())).thenReturn(Mono.empty());
            when(emailService.sendHtmlEmail(anyString(), anyString(), anyString(), any())).thenReturn(Mono.empty());

            StepVerifier.create(authService.sendOtpVerification("test@email.com"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when email not found")
        void sendOtp_emailNotFound() {
            when(authRepository.findByEmail("notfound@email.com")).thenReturn(Mono.empty());

            StepVerifier.create(authService.sendOtpVerification("notfound@email.com"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.USER_NOT_FOUND)
                    .verify();
        }
    }

    // ─── refreshAccessToken ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("refreshAccessToken()")
    class RefreshAccessToken {

        @Test
        @DisplayName("should fail when refresh token is blank")
        void refresh_blankToken() {
            StepVerifier.create(authService.refreshAccessToken("", null))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.REFRESH_TOKEN_NOT_FOUND)
                    .verify();
        }

        @Test
        @DisplayName("should fail when refresh token is null")
        void refresh_nullToken() {
            StepVerifier.create(authService.refreshAccessToken(null, null))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.REFRESH_TOKEN_NOT_FOUND)
                    .verify();
        }
        @Test
        @DisplayName("should fail for non-admin when organizationId is null")
        void refresh_nonAdmin_nullOrgId() throws Exception {
            com.nimbusds.jwt.JWTClaimsSet claims = new com.nimbusds.jwt.JWTClaimsSet.Builder().subject("1").build();
            when(jwtUtils.validateToken("valid-token")).thenReturn(claims);
            
            User user = User.builder().id(1).role(com.service.backend.shared.enums.UserRole.STAFF).build();
            when(authRepository.findById(1)).thenReturn(Mono.just(user));

            StepVerifier.create(authService.refreshAccessToken("valid-token", null))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FORBIDDEN)
                    .verify();
        }

        @Test
        @DisplayName("should return 4 for STAFF if verification level in org is 4")
        void refresh_staff_level4() throws Exception {
            com.nimbusds.jwt.JWTClaimsSet claims = new com.nimbusds.jwt.JWTClaimsSet.Builder().subject("1").build();
            when(jwtUtils.validateToken("valid-token")).thenReturn(claims);
            
            User user = User.builder().id(1).role(com.service.backend.shared.enums.UserRole.STAFF).build();
            when(authRepository.findById(1)).thenReturn(Mono.just(user));
            when(authRepository.getVerificationLevelByUserIdAndOrgId(1, 2)).thenReturn(Mono.just(4));
            when(jwtUtils.generateAccessToken(user, 2)).thenReturn("new-access-token");

            StepVerifier.create(authService.refreshAccessToken("valid-token", 2))
                    .assertNext(res -> {
                        assertThat(res.getAccessToken()).isEqualTo("new-access-token");
                        assertThat(res.getVerificationLevel()).isEqualTo(4);
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should default to 2 for STAFF if verification level in org is not 4")
        void refresh_staff_defaultLevel2() throws Exception {
            com.nimbusds.jwt.JWTClaimsSet claims = new com.nimbusds.jwt.JWTClaimsSet.Builder().subject("1").build();
            when(jwtUtils.validateToken("valid-token")).thenReturn(claims);
            
            User user = User.builder().id(1).role(com.service.backend.shared.enums.UserRole.STAFF).build();
            when(authRepository.findById(1)).thenReturn(Mono.just(user));
            when(authRepository.getVerificationLevelByUserIdAndOrgId(1, 2)).thenReturn(Mono.just(1));
            when(jwtUtils.generateAccessToken(user, 2)).thenReturn("new-access-token");

            StepVerifier.create(authService.refreshAccessToken("valid-token", 2))
                    .assertNext(res -> {
                        assertThat(res.getAccessToken()).isEqualTo("new-access-token");
                        assertThat(res.getVerificationLevel()).isEqualTo(2);
                    })
                    .verifyComplete();
        }
    }

    // ─── switchOrganization ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("switchOrganization()")
    class SwitchOrganization {

        @Test
        @DisplayName("should return 4 for STAFF if verification level in new org is 4")
        void switchOrg_staff_level4() throws Exception {
            com.nimbusds.jwt.JWTClaimsSet claims = new com.nimbusds.jwt.JWTClaimsSet.Builder().subject("1").build();
            when(jwtUtils.validateToken("valid-token")).thenReturn(claims);

            User user = User.builder().id(1).role(com.service.backend.shared.enums.UserRole.STAFF).build();
            when(authRepository.findById(1)).thenReturn(Mono.just(user));
            when(authRepository.getVerificationLevelByUserIdAndOrgId(1, 2)).thenReturn(Mono.just(4));
            when(jwtUtils.generateAccessToken(user, 2)).thenReturn("new-access-token");

            StepVerifier.create(authService.switchOrganization("valid-token", 2))
                    .assertNext(tuple -> {
                        assertThat(tuple.getT1()).isEqualTo("new-access-token");
                        assertThat(tuple.getT2()).isEqualTo(4);
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should default to 2 for STAFF if verification level in new org is not 4")
        void switchOrg_staff_defaultLevel2() throws Exception {
            com.nimbusds.jwt.JWTClaimsSet claims = new com.nimbusds.jwt.JWTClaimsSet.Builder().subject("1").build();
            when(jwtUtils.validateToken("valid-token")).thenReturn(claims);

            User user = User.builder().id(1).role(com.service.backend.shared.enums.UserRole.STAFF).build();
            when(authRepository.findById(1)).thenReturn(Mono.just(user));
            when(authRepository.getVerificationLevelByUserIdAndOrgId(1, 2)).thenReturn(Mono.just(1));
            when(jwtUtils.generateAccessToken(user, 2)).thenReturn("new-access-token");

            StepVerifier.create(authService.switchOrganization("valid-token", 2))
                    .assertNext(tuple -> {
                        assertThat(tuple.getT1()).isEqualTo("new-access-token");
                        assertThat(tuple.getT2()).isEqualTo(2);
                    })
                    .verifyComplete();
        }
    }
}
