package com.service.backend.user.service;

import com.service.backend.auth.dao.AuthRepository;
import com.service.backend.chat.service.ChatConversationRequestService;
import com.service.backend.organization.dao.OrganizationRepository;
import com.service.backend.shared.entity.OrganizationMember;
import com.service.backend.shared.entity.PeerVerification;
import com.service.backend.shared.entity.User;
import com.service.backend.shared.entity.UserNotificationSettings;
import com.service.backend.shared.enums.DocumentType;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.FileUploadService;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.service.OCRService;
import com.service.backend.shared.service.EmailService;
import com.service.backend.shared.service.SseService;
import com.service.backend.user.dao.DeviceTokenRepository;
import com.service.backend.user.dao.PeerVerificationRepository;
import com.service.backend.user.dao.UserLoginHistoryRepository;
import com.service.backend.user.dao.UserNotificationSettingsRepository;
import com.service.backend.user.dao.UserOrganizationMemberRepository;
import com.service.backend.user.dao.UserProfileRepository;
import com.service.backend.user.dto.CreateVerificationRequest;
import com.service.backend.user.dto.NotificationSettingsResponse;
import com.service.backend.user.dto.UpdateAvatarRequest;
import com.service.backend.user.dto.UpdateNotificationSettingsRequest;
import com.service.backend.user.dto.UserProfileResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @Mock private UserProfileRepository userProfileRepository;
    @Mock private AuthRepository authRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private UserLoginHistoryRepository userLoginHistoryRepository;
    @Mock private UserNotificationSettingsRepository userNotificationSettingsRepository;
    @Mock private UserOrganizationMemberRepository userOrganizationMemberRepository;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private PeerVerificationRepository peerVerificationRepository;
    @Mock private ChatConversationRequestService chatConversationRequestService;
    @Mock private FileUploadService fileUploadService;
    @Mock private ImageService imageService;
    @Mock private NotificationService notificationService;
    @Mock private DeviceTokenRepository deviceTokenRepository;
    @Mock private OCRService ocrService;
    @Mock private SseService sseService;
    @Mock private EmailService emailService;

    @InjectMocks
    private UserService userService;

    @Nested
    @DisplayName("createVerificationRequest()")
    class CreateVerificationRequestTests {

        @Test
        @DisplayName("should keep legacy single-file payload working")
        void createVerificationRequest_legacySingleFile() {
            CreateVerificationRequest request = legacyVerificationRequest("base64", "proof.png", DocumentType.IMAGE);

            when(fileUploadService.uploadBase64File("base64", "proof.png")).thenReturn(Mono.just("http://files/proof.png"));
            when(authRepository.insertVerificationRequest(1, 7, "http://files/proof.png", "IMAGE")).thenReturn(Mono.just(10));
            when(userOrganizationMemberRepository.updateVerificationLevelIfLowerByOrgAndUser(1, 7, 1)).thenReturn(Mono.just(1));
            when(fileUploadService.getLocalPath("http://files/proof.png")).thenReturn("/tmp/proof.png");
            when(ocrService.extractTextFromFile("/tmp/proof.png")).thenReturn(Mono.just("Họ tên: Nguyễn Văn A\nMSSV: 22123456\nNgành: Công nghệ thông tin"));
            when(authRepository.updateVerificationDocumentAndAiSummary(eq(10), eq("http://files/proof.png"), eq("IMAGE"), anyString()))
                    .thenReturn(Mono.empty());

            StepVerifier.create(userService.createVerificationRequest(7L, request))
                    .verifyComplete();

            verify(authRepository, timeout(1000)).updateVerificationDocumentAndAiSummary(
                    eq(10), eq("http://files/proof.png"), eq("IMAGE"), contains("22123456"));
        }

        @Test
        @DisplayName("should reject more than three files")
        void createVerificationRequest_tooManyFiles() {
            CreateVerificationRequest request = new CreateVerificationRequest();
            request.setOrganizationId(1);
            request.setFiles(List.of(
                    verificationFile("b1", "f1.png"),
                    verificationFile("b2", "f2.png"),
                    verificationFile("b3", "f3.png"),
                    verificationFile("b4", "f4.png")));

            StepVerifier.create(userService.createVerificationRequest(7L, request))
                    .expectErrorMatches(err -> err instanceof ApplicationException
                            && ((ApplicationException) err).getErrorCode() == ErrorCode.BAD_REQUEST)
                    .verify();

            verifyNoInteractions(fileUploadService);
        }

        @Test
        @DisplayName("should stop after first readable file")
        void createVerificationRequest_stopsAfterReadableFile() {
            CreateVerificationRequest request = new CreateVerificationRequest();
            request.setOrganizationId(1);
            request.setFiles(List.of(
                    verificationFile("b1", "f1.png"),
                    verificationFile("b2", "f2.png"),
                    verificationFile("b3", "f3.png")));

            when(fileUploadService.uploadBase64File("b1", "f1.png")).thenReturn(Mono.just("http://files/f1.png"));
            when(authRepository.insertVerificationRequest(1, 7, "http://files/f1.png", "IMAGE")).thenReturn(Mono.just(10));
            when(userOrganizationMemberRepository.updateVerificationLevelIfLowerByOrgAndUser(1, 7, 1)).thenReturn(Mono.just(1));
            when(fileUploadService.getLocalPath("http://files/f1.png")).thenReturn("/tmp/f1.png");
            when(ocrService.extractTextFromFile("/tmp/f1.png")).thenReturn(Mono.just("UNREADABLE"));
            when(fileUploadService.uploadBase64File("b2", "f2.png")).thenReturn(Mono.just("http://files/f2.png"));
            when(fileUploadService.getLocalPath("http://files/f2.png")).thenReturn("/tmp/f2.png");
            when(ocrService.extractTextFromFile("/tmp/f2.png")).thenReturn(Mono.just("Họ tên: Nguyễn Văn A\nMSSV: 22123456\nNgành: Công nghệ thông tin"));
            when(authRepository.updateVerificationDocumentAndAiSummary(eq(10), eq("http://files/f2.png"), eq("IMAGE"), anyString()))
                    .thenReturn(Mono.empty());

            StepVerifier.create(userService.createVerificationRequest(7L, request))
                    .verifyComplete();

            verify(authRepository, timeout(1000)).updateVerificationDocumentAndAiSummary(
                    eq(10), eq("http://files/f2.png"), eq("IMAGE"), contains("22123456"));
            verify(fileUploadService, after(500).never()).uploadBase64File("b3", "f3.png");
        }

        @Test
        @DisplayName("should keep first file when all files are unreadable")
        void createVerificationRequest_allUnreadableKeepsFirstFile() {
            CreateVerificationRequest request = new CreateVerificationRequest();
            request.setOrganizationId(1);
            request.setFiles(List.of(
                    verificationFile("b1", "f1.png"),
                    verificationFile("b2", "f2.png")));

            when(fileUploadService.uploadBase64File("b1", "f1.png")).thenReturn(Mono.just("http://files/f1.png"));
            when(authRepository.insertVerificationRequest(1, 7, "http://files/f1.png", "IMAGE")).thenReturn(Mono.just(10));
            when(userOrganizationMemberRepository.updateVerificationLevelIfLowerByOrgAndUser(1, 7, 1)).thenReturn(Mono.just(1));
            when(fileUploadService.getLocalPath("http://files/f1.png")).thenReturn("/tmp/f1.png");
            when(ocrService.extractTextFromFile("/tmp/f1.png")).thenReturn(Mono.just("UNREADABLE"));
            when(fileUploadService.uploadBase64File("b2", "f2.png")).thenReturn(Mono.just("http://files/f2.png"));
            when(fileUploadService.getLocalPath("http://files/f2.png")).thenReturn("/tmp/f2.png");
            when(ocrService.extractTextFromFile("/tmp/f2.png")).thenReturn(Mono.just("too short"));
            when(authRepository.updateVerificationDocumentAndAiSummary(10, "http://files/f1.png", "IMAGE", "UNREADABLE"))
                    .thenReturn(Mono.empty());

            StepVerifier.create(userService.createVerificationRequest(7L, request))
                    .verifyComplete();

            verify(authRepository, timeout(1000)).updateVerificationDocumentAndAiSummary(
                    10, "http://files/f1.png", "IMAGE", "UNREADABLE");
        }

        private CreateVerificationRequest legacyVerificationRequest(String base64, String fileName, DocumentType documentType) {
            CreateVerificationRequest request = new CreateVerificationRequest();
            request.setOrganizationId(1);
            request.setBase64File(base64);
            request.setOriginalFileName(fileName);
            request.setDocumentType(documentType);
            return request;
        }

        private CreateVerificationRequest.VerificationFileRequest verificationFile(String base64, String fileName) {
            CreateVerificationRequest.VerificationFileRequest file = new CreateVerificationRequest.VerificationFileRequest();
            file.setBase64File(base64);
            file.setOriginalFileName(fileName);
            file.setDocumentType(DocumentType.IMAGE);
            return file;
        }
    }

    // ─── getMyProfile ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getMyProfile()")
    class GetMyProfile {

        @Test
        @DisplayName("should return profile for existing user")
        void getMyProfile_success() {
            UserProfileResponse profile = UserProfileResponse.builder()
                    .userId(1)
                    .fullName("Test User")
                    .build();

            when(userProfileRepository.findProfileByUserId(1, null)).thenReturn(Mono.just(profile));

            StepVerifier.create(userService.getMyProfile(1L, null))
                    .assertNext(p -> assertThat(p.getFullName()).isEqualTo("Test User"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when user not found")
        void getMyProfile_notFound() {
            when(userProfileRepository.findProfileByUserId(99, null)).thenReturn(Mono.empty());

            StepVerifier.create(userService.getMyProfile(99L, null))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.USER_NOT_FOUND)
                    .verify();
        }
    }

    // ─── getPublicProfile ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("getPublicProfile()")
    class GetPublicProfile {

        @Test
        @DisplayName("should return public profile")
        void getPublicProfile_success() {
            UserProfileResponse profile = UserProfileResponse.builder()
                    .userId(2)
                    .fullName("Other User")
                    .build();

            when(userProfileRepository.findProfileByUserId(2, null)).thenReturn(Mono.just(profile));

            StepVerifier.create(userService.getPublicProfile(2, null))
                    .assertNext(p -> assertThat(p.getFullName()).isEqualTo("Other User"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when user not found")
        void getPublicProfile_notFound() {
            when(userProfileRepository.findProfileByUserId(99, null)).thenReturn(Mono.empty());

            StepVerifier.create(userService.getPublicProfile(99, null))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.USER_NOT_FOUND)
                    .verify();
        }
    }

    // ─── changeMyPassword ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("changeMyPassword()")
    class ChangeMyPassword {

        @Test
        @DisplayName("should change password successfully")
        void changeMyPassword_success() {
            User user = User.builder().id(1).email("test@example.com").passwordHash("oldHashed").build();

            when(authRepository.findById(1)).thenReturn(Mono.just(user));
            when(passwordEncoder.matches("oldPass", "oldHashed")).thenReturn(true);
            when(passwordEncoder.encode("newPass")).thenReturn("newHashed");
            when(authRepository.updatePasswordById(1, "newHashed")).thenReturn(Mono.empty());
            when(emailService.sendHtmlEmail(any(), any(), any(), any())).thenReturn(Mono.empty());

            StepVerifier.create(userService.changeMyPassword(1L, "oldPass", "newPass"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail with wrong old password")
        void changeMyPassword_wrongOldPassword() {
            User user = User.builder().id(1).passwordHash("oldHashed").build();

            when(authRepository.findById(1)).thenReturn(Mono.just(user));
            when(passwordEncoder.matches("wrongOld", "oldHashed")).thenReturn(false);

            StepVerifier.create(userService.changeMyPassword(1L, "wrongOld", "newPass"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.INVALID_OLD_PASSWORD)
                    .verify();
        }

        @Test
        @DisplayName("should fail when user not found")
        void changeMyPassword_userNotFound() {
            when(authRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(userService.changeMyPassword(99L, "oldPass", "newPass"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.USER_NOT_FOUND)
                    .verify();
        }
    }

    // ─── getMyLoginHistory ────────────────────────────────────────────────────

    @Nested
    @DisplayName("getMyLoginHistory()")
    class GetMyLoginHistory {

        @Test
        @DisplayName("should return login history list")
        void getMyLoginHistory_success() {
            com.service.backend.shared.entity.UserLoginHistory history =
                    com.service.backend.shared.entity.UserLoginHistory.builder()
                            .id(1L)
                            .loginMethod("EMAIL")
                            .loginIp("127.0.0.1")
                            .userAgent("TestAgent")
                            .loginAt(LocalDateTime.now())
                            .build();

            when(userLoginHistoryRepository.findByUserIdOrderByLoginAtDesc(1, 10, 0))
                    .thenReturn(Flux.just(history));

            StepVerifier.create(userService.getMyLoginHistory(1L, 0, 10))
                    .assertNext(list -> {
                        assertThat(list).hasSize(1);
                        assertThat(list.get(0).getLoginMethod()).isEqualTo("EMAIL");
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should return empty list when no history")
        void getMyLoginHistory_empty() {
            when(userLoginHistoryRepository.findByUserIdOrderByLoginAtDesc(1, 10, 0))
                    .thenReturn(Flux.empty());

            StepVerifier.create(userService.getMyLoginHistory(1L, 0, 10))
                    .assertNext(list -> assertThat(list).isEmpty())
                    .verifyComplete();
        }
    }

    // ─── getMyNotificationSettings ────────────────────────────────────────────

    @Nested
    @DisplayName("getMyNotificationSettings()")
    class GetMyNotificationSettings {

        @Test
        @DisplayName("should return existing notification settings")
        void getMyNotificationSettings_existing() {
            UserNotificationSettings settings = UserNotificationSettings.builder()
                    .userId(1)
                    .emailEnabled(true)
                    .pushEnabled(false)
                    .eventReminderEnabled(true)
                    .newsEnabled(false)
                    .forumReplyEnabled(true)
                    .build();

            when(userNotificationSettingsRepository.findById(1)).thenReturn(Mono.just(settings));

            StepVerifier.create(userService.getMyNotificationSettings(1L))
                    .assertNext(res -> {
                        assertThat(res.getEmailEnabled()).isTrue();
                        assertThat(res.getPushEnabled()).isFalse();
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should return default settings when not found")
        void getMyNotificationSettings_defaultSettings() {
            when(userNotificationSettingsRepository.findById(1)).thenReturn(Mono.empty());

            StepVerifier.create(userService.getMyNotificationSettings(1L))
                    .assertNext(res -> {
                        assertThat(res.getEmailEnabled()).isTrue();
                        assertThat(res.getPushEnabled()).isTrue();
                    })
                    .verifyComplete();
        }
    }

    // ─── updateMyNotificationSettings ────────────────────────────────────────

    @Nested
    @DisplayName("updateMyNotificationSettings()")
    class UpdateMyNotificationSettings {

        @Test
        @DisplayName("should update existing notification settings")
        void updateMyNotificationSettings_success() {
            UserNotificationSettings existing = UserNotificationSettings.builder()
                    .userId(1)
                    .emailEnabled(true)
                    .pushEnabled(true)
                    .eventReminderEnabled(true)
                    .newsEnabled(true)
                    .forumReplyEnabled(true)
                    .build();

            UpdateNotificationSettingsRequest request = new UpdateNotificationSettingsRequest();
            request.setEmailEnabled(false);
            request.setPushEnabled(false);

            when(userNotificationSettingsRepository.findById(1)).thenReturn(Mono.just(existing));
            when(userNotificationSettingsRepository.save(any())).thenReturn(Mono.just(
                    UserNotificationSettings.builder().userId(1).emailEnabled(false).pushEnabled(false)
                            .eventReminderEnabled(true).newsEnabled(true).forumReplyEnabled(true).build()
            ));

            StepVerifier.create(userService.updateMyNotificationSettings(1L, request))
                    .assertNext(res -> {
                        assertThat(res.getEmailEnabled()).isFalse();
                        assertThat(res.getPushEnabled()).isFalse();
                    })
                    .verifyComplete();
        }
    }

    // ─── updateMyAvatar ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateMyAvatar()")
    class UpdateMyAvatar {

        @Test
        @DisplayName("should convert the base64 avatar, store it, and return the resulting URL")
        void updateMyAvatar_success() {
            UpdateAvatarRequest request = new UpdateAvatarRequest();
            request.setAvatarBase64("data:image/png;base64,AAA");
            when(imageService.uploadBase64IfPresent("data:image/png;base64,AAA"))
                    .thenReturn(Mono.just("http://example.com/avatar.webp"));
            when(authRepository.updateAvatarById(1, "http://example.com/avatar.webp"))
                    .thenReturn(Mono.empty());

            StepVerifier.create(userService.updateMyAvatar(1L, request))
                    .expectNext("http://example.com/avatar.webp")
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when no avatar image is provided")
        void updateMyAvatar_missingImage() {
            UpdateAvatarRequest request = new UpdateAvatarRequest();
            when(imageService.uploadBase64IfPresent(null)).thenReturn(Mono.empty());

            StepVerifier.create(userService.updateMyAvatar(1L, request))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.BAD_REQUEST)
                    .verify();
        }
    }

    // ─── acceptPeerVerification ───────────────────────────────────────────────

    @Nested
    @DisplayName("acceptPeerVerification()")
    class AcceptPeerVerification {

        @Test
        @DisplayName("should fail when request not found")
        void acceptPeerVerification_requestNotFound() {
            when(peerVerificationRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(userService.acceptPeerVerification(1L, 99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.RESOURCES_NOT_FOUND)
                    .verify();
        }

        @Test
        @DisplayName("should fail when request is not pending")
        void acceptPeerVerification_notPending() {
            PeerVerification req = PeerVerification.builder()
                    .id(1)
                    .status(Status.APPROVED)
                    .targetMemberId(2)
                    .verifierMemberId(1)
                    .build();

            when(peerVerificationRepository.findById(1)).thenReturn(Mono.just(req));

            StepVerifier.create(userService.acceptPeerVerification(1L, 1))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.BAD_REQUEST)
                    .verify();
        }
    }
}
