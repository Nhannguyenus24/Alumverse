package com.service.backend.event.service;

import com.service.backend.event.dao.IEventRepository;
import com.service.backend.event.dto.*;
import com.service.backend.organization.dao.OrganizationRepository;
import com.service.backend.shared.entity.Event;
import com.service.backend.shared.entity.EventTicket;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.EmailService;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.user.service.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EventService Unit Tests")
class EventServiceTest {

    @Mock private IEventRepository eventRepository;
    @Mock private ImageService imageService;
    @Mock private EmailService emailService;
    @Mock private NotificationService notificationService;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private CacheUtils cacheUtils;
    @Mock private EventQrService eventQrService;
    @Mock private com.service.backend.event.dao.AttendeeLookupRepository attendeeLookupRepository;

    @InjectMocks
    private EventService eventService;

    /** Reactive security context with a staff role, required by the check-in gate. */
    private static reactor.util.context.Context staffContext() {
        return org.springframework.security.core.context.ReactiveSecurityContextHolder.withAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "1", null,
                        java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))));
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

            when(eventRepository.findEventById(1L)).thenReturn(Mono.just(event));

            StepVerifier.create(eventService.getEventById(1L))
                    .assertNext(e -> assertThat(e.getTitle()).isEqualTo("Test Event"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when event not found")
        void getEventById_notFound() {
            when(eventRepository.findEventById(99L)).thenReturn(Mono.empty());

            StepVerifier.create(eventService.getEventById(99L))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.EVENT_NOT_FOUND)
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

            when(eventRepository.findEventById(1L)).thenReturn(Mono.just(existing));
            when(imageService.uploadBase64IfPresent(any())).thenReturn(Mono.empty());
            when(eventRepository.updateEvent(eq(1L), any())).thenReturn(Mono.just(updated));

            StepVerifier.create(eventService.updateEvent(1L, request))
                    .assertNext(e -> assertThat(e.getTitle()).isEqualTo("New Title"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when event not found")
        void updateEvent_notFound() {
            UpdateEventRequest request = new UpdateEventRequest();
            request.setTitle("New Title");

            when(eventRepository.findEventById(99L)).thenReturn(Mono.empty());

            StepVerifier.create(eventService.updateEvent(99L, request))
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
            Event event = Event.builder().id(1L).title("Event to Delete").build();

            when(eventRepository.findEventById(1L)).thenReturn(Mono.just(event));
            when(eventRepository.deleteEvent(1L)).thenReturn(Mono.just(true));

            StepVerifier.create(eventService.deleteEvent(1L))
                    .assertNext(result -> assertThat(result).isTrue())
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when event not found")
        void deleteEvent_notFound() {
            when(eventRepository.findEventById(99L)).thenReturn(Mono.empty());

            StepVerifier.create(eventService.deleteEvent(99L))
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
            Event event = Event.builder().id(1L).title("Draft Event").build();
            Event publishedEvent = Event.builder().id(1L).title("Draft Event").build();

            when(eventRepository.findEventById(1L)).thenReturn(Mono.just(event));
            when(eventRepository.publishEvent(1L)).thenReturn(Mono.just(publishedEvent));

            StepVerifier.create(eventService.publishEvent(1L))
                    .assertNext(e -> assertThat(e.getId()).isEqualTo(1L))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when event not found")
        void publishEvent_notFound() {
            when(eventRepository.findEventById(99L)).thenReturn(Mono.empty());

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
            when(eventRepository.findTicketByCode("INVALID")).thenReturn(Mono.empty());

            StepVerifier.create(eventService.cancelTicket("INVALID", "User requested"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.TICKET_NOT_FOUND)
                    .verify();
        }

        @Test
        @DisplayName("should fail when ticket already cancelled")
        void cancelTicket_alreadyCancelled() {
            EventTicket cancelledTicket = EventTicket.builder()
                    .id(1L)
                    .ticketCode("TICKET-001")
                    .status(Status.CANCELLED)
                    .build();

            when(eventRepository.findTicketByCode("TICKET-001")).thenReturn(Mono.just(cancelledTicket));

            StepVerifier.create(eventService.cancelTicket("TICKET-001", "User requested"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.TICKET_ALREADY_CANCELLED)
                    .verify();
        }

        @Test
        @DisplayName("should cancel ticket successfully")
        void cancelTicket_success() {
            EventTicket activeTicket = EventTicket.builder()
                    .id(1L)
                    .ticketCode("TICKET-001")
                    .status(Status.ISSUED)
                    .build();

            EventTicket cancelledTicket = EventTicket.builder()
                    .id(1L)
                    .ticketCode("TICKET-001")
                    .status(Status.CANCELLED)
                    .build();

            when(eventRepository.findTicketByCode("TICKET-001")).thenReturn(Mono.just(activeTicket));
            when(eventRepository.cancelTicket(1L, "User requested")).thenReturn(Mono.just(cancelledTicket));

            StepVerifier.create(eventService.cancelTicket("TICKET-001", "User requested"))
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
                    .ticketCode("TICKET-001")
                    .status(Status.ISSUED)
                    .build();

            when(eventRepository.findTicketByCode("TICKET-001")).thenReturn(Mono.just(ticket));

            StepVerifier.create(eventService.getTicketByCode("TICKET-001"))
                    .assertNext(t -> assertThat(t.getTicketCode()).isEqualTo("TICKET-001"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when ticket not found")
        void getTicketByCode_notFound() {
            when(eventRepository.findTicketByCode("INVALID")).thenReturn(Mono.empty());

            StepVerifier.create(eventService.getTicketByCode("INVALID"))
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
            // No security context → no role → gate rejects before any DB access.
            StepVerifier.create(eventService.checkIn(1L, codeRequest("TICKET-001")))
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

            when(eventRepository.findTicketByCode("TICKET-001")).thenReturn(Mono.just(ticket));

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

            when(eventRepository.findTicketByCode("TICKET-001")).thenReturn(Mono.just(ticket));

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

            when(eventRepository.findTicketByCode("TICKET-001")).thenReturn(Mono.just(ticket));

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

            when(eventRepository.findTicketByCode("TICKET-001")).thenReturn(Mono.just(ticket));
            when(eventRepository.checkInTicket(1L)).thenReturn(Mono.just(checkedInTicket));

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
            when(eventRepository.findEventById(99L)).thenReturn(Mono.empty());

            StepVerifier.create(eventService.getEventStatistics(99L))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.EVENT_NOT_FOUND)
                    .verify();
        }
    }
}
