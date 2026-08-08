package com.service.backend.event.service;

import com.service.backend.event.dao.EventR2dbcRepository;
import com.service.backend.event.dao.EventInterestR2dbcRepository;
import com.service.backend.event.dao.EventTicketR2dbcRepository;
import com.service.backend.event.dao.EventInvitationR2dbcRepository;
import com.service.backend.event.dao.EventEmailLogR2dbcRepository;
import com.service.backend.event.dao.EventQuestionR2dbcRepository;
import com.service.backend.event.dto.*;
import com.service.backend.organization.dao.OrganizationRepository;
import com.service.backend.shared.entity.Event;
import com.service.backend.shared.entity.EventTicket;
import com.service.backend.shared.dto.FeaturedPaginatedResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.EmailService;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.user.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EventService Unit Tests")
class EventServiceTest {

        @Mock private EventR2dbcRepository eventRepo;
    @Mock private EventInterestR2dbcRepository interestRepo;
    @Mock private EventTicketR2dbcRepository ticketRepo;
    @Mock private EventInvitationR2dbcRepository invitationRepo;
    @Mock private EventEmailLogR2dbcRepository emailLogRepo;
    @Mock private EventQuestionR2dbcRepository questionRepo;
    @Mock private ImageService imageService;
    @Mock private EmailService emailService;
    @Mock private NotificationService notificationService;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private CacheUtils cacheUtils;
    @Mock private EventQrService eventQrService;
    @Mock private com.service.backend.user.dao.UserProfileRepository userProfileRepository;

    @InjectMocks
    private EventService eventService;

    @BeforeEach
    void stubCacheEviction() {
        // Writes now evict the event cache via cacheUtils.clear(...); stub it so reactive chains complete.
        lenient().when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());
    }

    /** Reactive security context with ADMIN role for event management checks. */
    private static reactor.util.context.Context adminContext() {
        return org.springframework.security.core.context.ReactiveSecurityContextHolder.withAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "1", null,
                        java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))));
    }

    private static reactor.util.context.Context userContext() {
        var authentication = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                "1", null,
                java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER")));
        authentication.setDetails(1);
        return org.springframework.security.core.context.ReactiveSecurityContextHolder.withAuthentication(authentication);
    }

    /** Alias kept for check-in tests that already use this name. */
    private static reactor.util.context.Context staffContext() {
        return adminContext();
    }

    private static CheckInRequest codeRequest(String code) {
        CheckInRequest request = new CheckInRequest();
        request.setCode(code);
        return request;
    }

    // ─── getEventById ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getEventById()")
    class GetEventById {

        @Test
        @DisplayName("should return event when found")
        void getEventById_success() {
            Event event = Event.builder()
                    .id(1L)
                    .title("Test Event")
                    .description("A test event")
                    .build();

            when(eventRepo.findById(1L)).thenReturn(Mono.just(event));

            StepVerifier.create(eventService.getEventById(1L))
                    .assertNext(e -> assertThat(e.getTitle()).isEqualTo("Test Event"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when event not found")
        void getEventById_notFound() {
            when(eventRepo.findById(99L)).thenReturn(Mono.empty());

            StepVerifier.create(eventService.getEventById(99L))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.EVENT_NOT_FOUND)
                    .verify();
        }
    }

    @Nested
    @DisplayName("public event lists")
    class PublicEventLists {

        @SuppressWarnings("unchecked")
        private void passThroughUpcomingCache() {
            when(cacheUtils.<FeaturedPaginatedResponse<Event>>getOrCompute(
                    eq("event_cache"), anyString(), any(), any()))
                    .thenAnswer(invocation ->
                            ((Supplier<Mono<FeaturedPaginatedResponse<Event>>>) invocation.getArgument(3)).get());
        }

        @SuppressWarnings("unchecked")
        private void passThroughOngoingCache() {
            when(cacheUtils.<PaginatedResponse<Event>>getOrCompute(
                    eq("event_cache"), anyString(), any(), any()))
                    .thenAnswer(invocation ->
                            ((Supplier<Mono<PaginatedResponse<Event>>>) invocation.getArgument(3)).get());
        }

        @Test
        @DisplayName("should preserve the mobile response items when featured mode is disabled")
        void upcomingWithoutFeaturedKeepsItemsContract() {
            passThroughUpcomingCache();
            Event first = Event.builder().id(1L).description("<p>First&nbsp;event</p>").build();
            when(eventRepo.findUpcomingEventList(
                    eq(3L), any(LocalDateTime.class), eq(-1L), eq(""), eq(""),
                    eq(""), eq(""), eq("status"), eq(6), eq(0)))
                    .thenReturn(Flux.just(first));
            when(eventRepo.countUpcomingEventList(
                    eq(3L), any(LocalDateTime.class), eq(-1L), eq(""), eq(""), eq(""), eq("")))
                    .thenReturn(Mono.just(1L));

            StepVerifier.create(eventService.getUpcomingEventList(
                            3L, 0, 6, null, null, null, null, null, false))
                    .assertNext(response -> {
                        assertThat(response.getFeatured()).isNull();
                        assertThat(response.getItems()).extracting(Event::getId).containsExactly(1L);
                        assertThat(response.getItems().get(0).getDescription()).isEqualTo("First event");
                        assertThat(response.getTotalItem()).isEqualTo(1L);
                    })
                    .verifyComplete();

            verify(eventRepo, never()).findEventPageFeatured(
                    anyLong(), any(), anyString(), anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("should separate a filtered featured event and paginate only the remaining items")
        void upcomingWithFeaturedUsesFilteredPagination() {
            passThroughUpcomingCache();
            Event featured = Event.builder().id(10L).description("<p>Featured &amp; event</p>").build();
            Event item = Event.builder().id(9L).description("<div>Grid&nbsp;event</div>").build();
            when(eventRepo.findEventPageFeatured(
                    eq(4L), any(LocalDateTime.class), eq("campus"), eq("conference,workshop"),
                    eq("2026-08-01"), eq("2026-08-31")))
                    .thenReturn(Mono.just(featured));
            when(eventRepo.findUpcomingEventList(
                    eq(4L), any(LocalDateTime.class), eq(10L), eq("campus"),
                    eq("conference,workshop"), eq("2026-08-01"), eq("2026-08-31"),
                    eq("oldest"), eq(6), eq(6)))
                    .thenReturn(Flux.just(item));
            when(eventRepo.countUpcomingEventList(
                    eq(4L), any(LocalDateTime.class), eq(10L), eq("campus"),
                    eq("conference,workshop"), eq("2026-08-01"), eq("2026-08-31")))
                    .thenReturn(Mono.just(7L));

            StepVerifier.create(eventService.getUpcomingEventList(
                            4L, 1, 6, " campus ", "workshop,conference",
                            LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31), "oldest", true))
                    .assertNext(response -> {
                        assertThat(response.getFeatured().getId()).isEqualTo(10L);
                        assertThat(response.getFeatured().getDescription()).isEqualTo("Featured & event");
                        assertThat(response.getItems()).extracting(Event::getId).containsExactly(9L);
                        assertThat(response.getTotalItem()).isEqualTo(7L);
                        assertThat(response.getTotalPage()).isEqualTo(2);
                        assertThat(response.getCurrentPage()).isEqualTo(1);
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should exclude the shared featured event from ongoing pagination when opted in")
        void ongoingExcludesSharedFeaturedWhenOptedIn() {
            passThroughOngoingCache();
            Event featured = Event.builder().id(20L).build();
            Event item = Event.builder().id(21L).description("<p>Other ongoing</p>").build();
            when(eventRepo.findEventPageFeatured(
                    eq(4L), any(LocalDateTime.class), eq("campus"), eq("conference"),
                    eq("2026-08-01"), eq("2026-08-31")))
                    .thenReturn(Mono.just(featured));
            when(eventRepo.findOngoingEventList(
                    eq(4L), any(LocalDateTime.class), eq(20L), eq("campus"), eq("conference"),
                    eq("2026-08-01"), eq("2026-08-31"), eq("newest"), eq(6), eq(0)))
                    .thenReturn(Flux.just(item));
            when(eventRepo.countOngoingEventList(
                    eq(4L), any(LocalDateTime.class), eq(20L), eq("campus"), eq("conference"),
                    eq("2026-08-01"), eq("2026-08-31")))
                    .thenReturn(Mono.just(1L));

            StepVerifier.create(eventService.getOngoingEventList(
                            4L, 0, 6, " campus ", "conference",
                            LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31), "newest", true))
                    .assertNext(response -> {
                        assertThat(response.getItems()).extracting(Event::getId).containsExactly(21L);
                        assertThat(response.getTotalItem()).isEqualTo(1L);
                        assertThat(response.getTotalPage()).isEqualTo(1);
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should preserve ongoing items when featured exclusion is disabled")
        void ongoingLegacyCallKeepsItemsContract() {
            passThroughOngoingCache();
            Event item = Event.builder().id(20L).build();
            when(eventRepo.findOngoingEventList(
                    eq(4L), any(LocalDateTime.class), eq(-1L), eq(""), eq(""), eq(""), eq(""),
                    eq("status"), eq(20), eq(0)))
                    .thenReturn(Flux.just(item));
            when(eventRepo.countOngoingEventList(
                    eq(4L), any(LocalDateTime.class), eq(-1L), eq(""), eq(""), eq(""), eq("")))
                    .thenReturn(Mono.just(1L));

            StepVerifier.create(eventService.getOngoingEventList(
                            4L, 0, 20, null, null, null, null, null, false))
                    .assertNext(response -> {
                        assertThat(response.getItems()).extracting(Event::getId).containsExactly(20L);
                        assertThat(response.getTotalItem()).isEqualTo(1L);
                    })
                    .verifyComplete();

            verify(eventRepo, never()).findEventPageFeatured(
                    anyLong(), any(), anyString(), anyString(), anyString(), anyString());
        }
    }

    @Nested
    @DisplayName("registerForEvent()")
    class RegisterForEvent {

        @Test
        @DisplayName("should reject registration for an unpublished event")
        void registerForEvent_unpublished() {
            Event event = Event.builder().id(1L).organizationId(1L).isPublished(false).build();
            when(eventRepo.findById(1L)).thenReturn(Mono.just(event));
            when(ticketRepo.existsActiveByEventIdAndMemberId(1L, 1L)).thenReturn(Mono.just(false));
            when(ticketRepo.existsBannedByEventIdAndMemberId(1L, 1L)).thenReturn(Mono.just(false));

            StepVerifier.create(eventService.registerForEvent(1L, null).contextWrite(userContext()))
                    .expectErrorMatches(error -> error instanceof ApplicationException
                            && ((ApplicationException) error).getErrorCode() == ErrorCode.EVENT_NOT_PUBLISHED)
                    .verify();
        }

        @Test
        @DisplayName("should reject registration before the registration window")
        void registerForEvent_notOpen() {
            Event event = Event.builder()
                    .id(1L).organizationId(1L).isPublished(true)
                    .registrationStartAt(LocalDateTime.now().plusHours(1))
                    .startTime(LocalDateTime.now().plusDays(1))
                    .build();
            when(eventRepo.findById(1L)).thenReturn(Mono.just(event));
            when(ticketRepo.existsActiveByEventIdAndMemberId(1L, 1L)).thenReturn(Mono.just(false));
            when(ticketRepo.existsBannedByEventIdAndMemberId(1L, 1L)).thenReturn(Mono.just(false));

            StepVerifier.create(eventService.registerForEvent(1L, null).contextWrite(userContext()))
                    .expectErrorMatches(error -> error instanceof ApplicationException
                            && ((ApplicationException) error).getErrorCode() == ErrorCode.EVENT_REGISTRATION_NOT_OPEN)
                    .verify();
        }

        @Test
        @DisplayName("should reject registration after the registration window")
        void registerForEvent_closed() {
            Event event = Event.builder()
                    .id(1L).organizationId(1L).isPublished(true)
                    .registrationStartAt(LocalDateTime.now().minusDays(1))
                    .registrationEndAt(LocalDateTime.now().minusMinutes(1))
                    .startTime(LocalDateTime.now().plusHours(1))
                    .build();
            when(eventRepo.findById(1L)).thenReturn(Mono.just(event));
            when(ticketRepo.existsActiveByEventIdAndMemberId(1L, 1L)).thenReturn(Mono.just(false));
            when(ticketRepo.existsBannedByEventIdAndMemberId(1L, 1L)).thenReturn(Mono.just(false));

            StepVerifier.create(eventService.registerForEvent(1L, null).contextWrite(userContext()))
                    .expectErrorMatches(error -> error instanceof ApplicationException
                            && ((ApplicationException) error).getErrorCode() == ErrorCode.EVENT_REGISTRATION_CLOSED)
                    .verify();
        }
    }

    // ─── updateEvent ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateEvent()")
    class UpdateEvent {

        @Test
        @DisplayName("should update event successfully")
        void updateEvent_success() {
            Event existing = Event.builder()
                    .id(1L)
                    .organizationId(1L)
                    .title("Old Title")
                    .description("Old Desc")
                    .bannerUrl("http://old.jpg")
                    .build();

            Event updated = Event.builder()
                    .id(1L)
                    .title("New Title")
                    .description("New Desc")
                    .build();

            UpdateEventRequest request = new UpdateEventRequest();
            request.setTitle("New Title");
            request.setDescription("New Desc");

            when(eventRepo.findById(1L)).thenReturn(Mono.just(existing));
            when(imageService.uploadBase64IfPresent(any())).thenReturn(Mono.empty());
            when(eventRepo.save(any())).thenReturn(Mono.just(updated));

            StepVerifier.create(eventService.updateEvent(1L, request)
                            .contextWrite(adminContext()))
                    .assertNext(e -> assertThat(e.getTitle()).isEqualTo("New Title"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when event not found")
        void updateEvent_notFound() {
            UpdateEventRequest request = new UpdateEventRequest();
            request.setTitle("New Title");

            when(eventRepo.findById(99L)).thenReturn(Mono.empty());

            StepVerifier.create(eventService.updateEvent(99L, request)
                            .contextWrite(adminContext()))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.EVENT_NOT_FOUND)
                    .verify();
        }
    }

    // ─── deleteEvent ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteEvent()")
    class DeleteEvent {

        @Test
        @DisplayName("should delete event successfully")
        void deleteEvent_success() {
            Event event = Event.builder().id(1L).organizationId(1L).title("Event to Delete").build();

            when(eventRepo.findById(1L)).thenReturn(Mono.just(event));
            when(eventRepo.deleteById(1L)).thenReturn(Mono.empty());

            StepVerifier.create(eventService.deleteEvent(1L)
                            .contextWrite(adminContext()))
                    .assertNext(result -> assertThat(result).isTrue())
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when event not found")
        void deleteEvent_notFound() {
            when(eventRepo.findById(99L)).thenReturn(Mono.empty());

            StepVerifier.create(eventService.deleteEvent(99L)
                            .contextWrite(adminContext()))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.EVENT_NOT_FOUND)
                    .verify();
        }
    }

    // ─── publishEvent ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("publishEvent()")
    class PublishEvent {

        @Test
        @DisplayName("should publish event successfully")
        void publishEvent_success() {
            Event event = Event.builder().id(1L).organizationId(1L).title("Draft Event").build();
            Event publishedEvent = Event.builder().id(1L).title("Draft Event").build();

            when(eventRepo.findById(1L)).thenReturn(Mono.just(event), Mono.just(publishedEvent));
            when(eventRepo.publishEvent(1L)).thenReturn(Mono.empty());

            StepVerifier.create(eventService.publishEvent(1L)
                            .contextWrite(adminContext()))
                    .assertNext(e -> assertThat(e.getId()).isEqualTo(1L))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when event not found")
        void publishEvent_notFound() {
            when(eventRepo.findById(99L)).thenReturn(Mono.empty());

            StepVerifier.create(eventService.publishEvent(99L))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.EVENT_NOT_FOUND)
                    .verify();
        }
    }

    // ─── cancelTicket ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("cancelTicket()")
    class CancelTicket {

        @Test
        @DisplayName("should fail when cancel reason is blank")
        void cancelTicket_noReason() {
            StepVerifier.create(eventService.cancelTicket("TICKET-001", ""))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.CANCEL_REASON_REQUIRED)
                    .verify();
        }

        @Test
        @DisplayName("should fail when ticket not found")
        void cancelTicket_ticketNotFound() {
            when(ticketRepo.findByTicketCode("INVALID")).thenReturn(Mono.empty());

            StepVerifier.create(eventService.cancelTicket("INVALID", "User requested")
                            .contextWrite(userContext()))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.TICKET_NOT_FOUND)
                    .verify();
        }

        @Test
        @DisplayName("should fail when ticket already cancelled")
        void cancelTicket_alreadyCancelled() {
            EventTicket cancelledTicket = EventTicket.builder()
                    .id(1L)
                    .memberId(1L)
                    .ticketCode("TICKET-001")
                    .status(Status.CANCELLED)
                    .build();

            when(ticketRepo.findByTicketCode("TICKET-001")).thenReturn(Mono.just(cancelledTicket));

            StepVerifier.create(eventService.cancelTicket("TICKET-001", "User requested")
                            .contextWrite(userContext()))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.TICKET_ALREADY_CANCELLED)
                    .verify();
        }

        @Test
        @DisplayName("should cancel ticket successfully")
        void cancelTicket_success() {
            EventTicket activeTicket = EventTicket.builder()
                    .id(1L)
                    .memberId(1L)
                    .ticketCode("TICKET-001")
                    .status(Status.ISSUED)
                    .build();

            EventTicket cancelledTicket = EventTicket.builder()
                    .id(1L)
                    .memberId(1L)
                    .ticketCode("TICKET-001")
                    .status(Status.CANCELLED)
                    .build();

            when(ticketRepo.findByTicketCode("TICKET-001")).thenReturn(Mono.just(activeTicket));
            when(ticketRepo.cancelTicket(1L, "User requested")).thenReturn(Mono.empty());
            when(ticketRepo.findById(1L)).thenReturn(Mono.just(cancelledTicket));

            StepVerifier.create(eventService.cancelTicket("TICKET-001", "User requested")
                            .contextWrite(userContext()))
                    .assertNext(t -> assertThat(t.getStatus()).isEqualTo(Status.CANCELLED))
                    .verifyComplete();
        }
    }

    // ─── getTicketByCode ────────────────────────────────────────────────────

    @Nested
    @DisplayName("getTicketByCode()")
    class GetTicketByCode {

        @Test
        @DisplayName("should return ticket when found")
        void getTicketByCode_success() {
            EventTicket ticket = EventTicket.builder()
                    .id(1L)
                    .memberId(1L)
                    .ticketCode("TICKET-001")
                    .status(Status.ISSUED)
                    .build();

            when(ticketRepo.findByTicketCode("TICKET-001")).thenReturn(Mono.just(ticket));
            when(userProfileRepository.findAttendeeProfileByUserId(1)).thenReturn(Mono.empty());

            StepVerifier.create(eventService.getTicketByCode("TICKET-001")
                            .contextWrite(userContext()))
                    .assertNext(t -> assertThat(t.getTicketCode()).isEqualTo("TICKET-001"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when ticket not found")
        void getTicketByCode_notFound() {
            when(ticketRepo.findByTicketCode("INVALID")).thenReturn(Mono.empty());

            StepVerifier.create(eventService.getTicketByCode("INVALID")
                            .contextWrite(userContext()))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.TICKET_NOT_FOUND)
                    .verify();
        }
    }

    // ─── checkIn (event-scoped) ──────────────────────────────────────────────

    @Nested
    @DisplayName("checkIn()")
    class CheckIn {

        @Test
        @DisplayName("should fail without a staff role")
        void checkIn_forbiddenForNonStaff() {
            Event event = Event.builder().id(1L).organizationId(1L).title("Test Event").build();

            when(eventRepo.findById(1L)).thenReturn(Mono.just(event));

            StepVerifier.create(eventService.checkIn(1L, codeRequest("TICKET-001"))
                            .contextWrite(userContext()))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FORBIDDEN)
                    .verify();
        }

        @Test
        @DisplayName("should fail when ticket belongs to another event")
        void checkIn_wrongEvent() {
            EventTicket ticket = EventTicket.builder()
                    .id(1L)
                    .eventId(2L)
                    .ticketCode("TICKET-001")
                    .status(Status.ISSUED)
                    .build();

            Event event = Event.builder().id(1L).organizationId(1L).title("Test Event").build();

            when(eventRepo.findById(1L)).thenReturn(Mono.just(event));
            when(ticketRepo.findByTicketCode("TICKET-001")).thenReturn(Mono.just(ticket));

            StepVerifier.create(eventService.checkIn(1L, codeRequest("TICKET-001"))
                            .contextWrite(staffContext()))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.TICKET_WRONG_EVENT)
                    .verify();
        }

        @Test
        @DisplayName("should fail when ticket already checked in")
        void checkIn_alreadyCheckedIn() {
            EventTicket ticket = EventTicket.builder()
                    .id(1L)
                    .eventId(1L)
                    .ticketCode("TICKET-001")
                    .status(Status.CHECKED_IN)
                    .build();

            Event event = Event.builder().id(1L).organizationId(1L).title("Test Event").build();

            when(eventRepo.findById(1L)).thenReturn(Mono.just(event));
            when(ticketRepo.findByTicketCode("TICKET-001")).thenReturn(Mono.just(ticket));

            StepVerifier.create(eventService.checkIn(1L, codeRequest("TICKET-001"))
                            .contextWrite(staffContext()))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.TICKET_ALREADY_CHECKED_IN)
                    .verify();
        }

        @Test
        @DisplayName("should fail when ticket is cancelled")
        void checkIn_cancelled() {
            EventTicket ticket = EventTicket.builder()
                    .id(1L)
                    .eventId(1L)
                    .ticketCode("TICKET-001")
                    .status(Status.CANCELLED)
                    .build();

            Event event = Event.builder().id(1L).organizationId(1L).title("Test Event").build();

            when(eventRepo.findById(1L)).thenReturn(Mono.just(event));
            when(ticketRepo.findByTicketCode("TICKET-001")).thenReturn(Mono.just(ticket));

            StepVerifier.create(eventService.checkIn(1L, codeRequest("TICKET-001"))
                            .contextWrite(staffContext()))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.TICKET_ALREADY_CANCELLED)
                    .verify();
        }

        @Test
        @DisplayName("should check in successfully when status is ISSUED and event matches")
        void checkIn_success() {
            EventTicket ticket = EventTicket.builder()
                    .id(1L)
                    .eventId(1L)
                    .ticketCode("TICKET-001")
                    .status(Status.ISSUED)
                    .build();

            EventTicket checkedInTicket = EventTicket.builder()
                    .id(1L)
                    .eventId(1L)
                    .ticketCode("TICKET-001")
                    .status(Status.CHECKED_IN)
                    .build();

            Event event = Event.builder().id(1L).organizationId(1L).title("Test Event").build();

            when(ticketRepo.findByTicketCode("TICKET-001")).thenReturn(Mono.just(ticket));
            when(ticketRepo.checkInTicket(eq(1L), any())).thenReturn(Mono.empty());
            when(ticketRepo.findById(1L)).thenReturn(Mono.just(checkedInTicket));
            when(eventRepo.findById(1L)).thenReturn(Mono.just(event));

            StepVerifier.create(eventService.checkIn(1L, codeRequest("TICKET-001"))
                            .contextWrite(staffContext()))
                    .assertNext(t -> assertThat(t.getStatus()).isEqualTo(Status.CHECKED_IN))
                    .verifyComplete();
        }
    }

    // ─── getEventStatistics ──────────────────────────────────────────────────

    @Nested
    @DisplayName("getEventStatistics()")
    class GetEventStatistics {

        @Test
        @DisplayName("should fail when event not found")
        void getEventStatistics_notFound() {
            when(eventRepo.findById(99L)).thenReturn(Mono.empty());

            StepVerifier.create(eventService.getEventStatistics(99L))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.EVENT_NOT_FOUND)
                    .verify();
        }
    }
}
