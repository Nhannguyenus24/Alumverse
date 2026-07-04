package com.service.backend.mentorship.service;

import com.service.backend.mentorship.dao.*;
import com.service.backend.mentorship.dto.*;
import com.service.backend.user.dao.UserProfileRepository;
import com.service.backend.shared.entity.*;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.user.service.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MentorService Unit Tests")
class MentorServiceTest {

    @Mock private MentorProfileR2dbcRepository profileRepository;
    @Mock private MentorExpertiseR2dbcRepository expertiseRepository;
    @Mock private MentorAvailabilityR2dbcRepository availabilityRepository;
    @Mock private MentorshipSessionR2dbcRepository sessionRepository;
    @Mock private SessionFeedbackR2dbcRepository feedbackRepository;
    @Mock private UserProfileRepository userProfileRepository;
    @Mock private DatabaseClient databaseClient;
    @Mock private MentorshipAccessService accessService;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private MentorService mentorService;

    private Context withUser(String userId) {
        return ReactiveSecurityContextHolder.withAuthentication(
                new UsernamePasswordAuthenticationToken(userId, "pass", Collections.emptyList())
        );
    }

    // ─── updateProfile ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateProfile()")
    class UpdateProfile {

        @Test
        @DisplayName("should fail when mentor profile not found")
        void updateProfile_notFound() {
            UpdateMentorProfileRequest request = new UpdateMentorProfileRequest();
            request.setBio("Updated bio");

            when(profileRepository.findById(5)).thenReturn(Mono.empty());

            StepVerifier.create(mentorService.updateProfile(request).contextWrite(withUser("5")))
                    .expectError(ApplicationException.class)
                    .verify();
        }
    }

    // ─── addExpertise ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("addExpertise()")
    class AddExpertise {

        @Test
        @DisplayName("should save expertise and return response")
        void addExpertise_success() {
            CreateExpertiseRequest request = new CreateExpertiseRequest();
            request.setTopic("Java");
            request.setYearsExperience(3);
            request.setDescription("Java development");
            request.setCategory("Programming");

            MentorExpertise saved = MentorExpertise.builder()
                    .id(1)
                    .mentorMemberId(5)
                    .topic("Java")
                    .yearsExperience(3)
                    .description("Java development")
                    .category("Programming")
                    .build();

            when(expertiseRepository.save(any())).thenReturn(Mono.just(saved));

            StepVerifier.create(mentorService.addExpertise(request).contextWrite(withUser("5")))
                    .assertNext(res -> {
                        assertThat(res.getTopic()).isEqualTo("Java");
                        assertThat(res.getCategory()).isEqualTo("Programming");
                    })
                    .verifyComplete();
        }
    }

    // ─── deleteExpertise ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteExpertise()")
    class DeleteExpertise {

        @Test
        @DisplayName("should fail when expertise not found")
        void deleteExpertise_notFound() {
            when(expertiseRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(mentorService.deleteExpertise(99).contextWrite(withUser("5")))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.EXPERTISE_NOT_FOUND)
                    .verify();
        }

        @Test
        @DisplayName("should fail when mentor doesn't own expertise")
        void deleteExpertise_notOwner() {
            MentorExpertise expertise = MentorExpertise.builder()
                    .id(1)
                    .mentorMemberId(99) // owned by someone else
                    .topic("Java")
                    .build();

            when(expertiseRepository.findById(1)).thenReturn(Mono.just(expertise));

            StepVerifier.create(mentorService.deleteExpertise(1).contextWrite(withUser("5")))
                    .expectError(ApplicationException.class)
                    .verify();
        }
    }

    // ─── updateSessionMeetingLink ─────────────────────────────────────────────

    @Nested
    @DisplayName("updateSessionMeetingLink()")
    class UpdateSessionMeetingLink {

        @Test
        @DisplayName("should fail when meeting link is blank")
        void updateSessionMeetingLink_blankLink() {
            StepVerifier.create(mentorService.updateSessionMeetingLink(1, "").contextWrite(withUser("5")))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.BAD_REQUEST)
                    .verify();
        }

        @Test
        @DisplayName("should fail when session not found")
        void updateSessionMeetingLink_sessionNotFound() {
            when(sessionRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(mentorService.updateSessionMeetingLink(99, "https://meet.google.com/abc").contextWrite(withUser("5")))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.SESSION_NOT_FOUND)
                    .verify();
        }
    }

    // ─── cancelSession ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("cancelSession()")
    class CancelSession {

        @Test
        @DisplayName("should fail when session not found")
        void cancelSession_notFound() {
            when(sessionRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(mentorService.cancelSession(99, "Not available").contextWrite(withUser("5")))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.SESSION_NOT_FOUND)
                    .verify();
        }

        @Test
        @DisplayName("should fail when session already cancelled")
        void cancelSession_alreadyCancelled() {
            MentorshipSession session = MentorshipSession.builder()
                    .id(1)
                    .status(Status.CANCELLED_BY_MENTOR)
                    .build();

            when(sessionRepository.findById(1)).thenReturn(Mono.just(session));

            StepVerifier.create(mentorService.cancelSession(1, "Not available").contextWrite(withUser("5")))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.SESSION_ALREADY_CANCELLED)
                    .verify();
        }
    }

    // ─── postponeSession ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("postponeSession()")
    class PostponeSession {

        @Test
        @DisplayName("should fail when session not found")
        void postponeSession_sessionNotFound() {
            LocalDateTime future = LocalDateTime.now().plusDays(1);
            PostponeSessionRequest request = new PostponeSessionRequest();
            request.setProposedStartTime(future);
            request.setProposedEndTime(future.plusHours(1));

            when(sessionRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(mentorService.postponeSession(99, request).contextWrite(withUser("5")))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.SESSION_NOT_FOUND)
                    .verify();
        }
    }

    // ─── getMyAvailabilities ──────────────────────────────────────────────────

    @Nested
    @DisplayName("getMyAvailabilities()")
    class GetMyAvailabilities {

        @Test
        @DisplayName("should return list of availabilities")
        void getMyAvailabilities_success() {
            MentorAvailability slot1 = MentorAvailability.builder()
                    .id(1)
                    .mentorMemberId(5)
                    .startTime(LocalDateTime.now().plusDays(1))
                    .endTime(LocalDateTime.now().plusDays(1).plusHours(1))
                    .status(Status.AVAILABLE)
                    .build();

            when(availabilityRepository.findByMentorMemberId(5)).thenReturn(Flux.just(slot1));

            StepVerifier.create(mentorService.getMyAvailabilities().contextWrite(withUser("5")))
                    .assertNext(list -> assertThat(list).hasSize(1))
                    .verifyComplete();
        }
    }
}
