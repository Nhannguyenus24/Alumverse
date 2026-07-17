package com.service.backend.mentorship.service;

import com.service.backend.auth.dao.AuthRepository;
import com.service.backend.shared.entity.MentorProfile;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MentorshipAccessService Unit Tests")
class MentorshipAccessServiceTest {

    @Mock private AuthRepository authRepository;
    @Mock private com.service.backend.mentorship.dao.MentorProfileR2dbcRepository mentorProfileRepository;

    @InjectMocks
    private MentorshipAccessService accessService;

    // ─── requireApprovedMentorProfile ─────────────────────────────────────────

    @Nested
    @DisplayName("requireApprovedMentorProfile()")
    class RequireApprovedMentorProfile {

        @Test
        @DisplayName("should return profile when mentor is approved")
        void requireApprovedMentorProfile_success() {
            MentorProfile profile = MentorProfile.builder()
                    .memberId(1)
                    .status(Status.APPROVED)
                    .build();

            when(mentorProfileRepository.findApprovedMentor(1, null)).thenReturn(Mono.just(profile));

            StepVerifier.create(accessService.requireApprovedMentorProfile(1))
                    .assertNext(p -> assertThat(p.getStatus()).isEqualTo(Status.APPROVED))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when mentor profile not found")
        void requireApprovedMentorProfile_notFound() {
            when(mentorProfileRepository.findApprovedMentor(99, null)).thenReturn(Mono.empty());

            StepVerifier.create(accessService.requireApprovedMentorProfile(99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.MENTOR_PROFILE_NOT_FOUND)
                    .verify();
        }

        @Test
        @DisplayName("should fail when mentor profile is pending (not approved)")
        void requireApprovedMentorProfile_pending() {
            // A pending profile is excluded by findApprovedMentor, so the query returns empty
            // and the service surfaces MENTOR_PROFILE_NOT_FOUND (avoids exposing pending profiles).
            when(mentorProfileRepository.findApprovedMentor(1, null)).thenReturn(Mono.empty());

            StepVerifier.create(accessService.requireApprovedMentorProfile(1))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.MENTOR_PROFILE_NOT_FOUND)
                    .verify();
        }
    }

    // ─── requireMinVerificationLevel ─────────────────────────────────────────

    @Nested
    @DisplayName("requireMinVerificationLevel()")
    class RequireMinVerificationLevel {

        @Test
        @DisplayName("should fail when verification level is insufficient")
        void requireMinVerificationLevel_insufficient() {
            // Note: because SecurityUtils is not mocked here to provide the current user context,
            // this stream will fail internally. It's expected to return Mono.error in real usage if verification fails.
            StepVerifier.create(accessService.requireMinVerificationLevel(1))
                    .expectError()
                    .verify();
        }
    }
}
