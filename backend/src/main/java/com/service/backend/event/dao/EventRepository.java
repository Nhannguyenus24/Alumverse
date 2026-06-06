package com.service.backend.event.dao;

import com.service.backend.shared.entity.*;
import com.service.backend.shared.enums.Status;
import com.service.backend.event.dto.EventStatisticsResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class EventRepository implements IEventRepository {

    private final EventR2dbcRepository eventRepo;
    private final EventInterestR2dbcRepository interestRepo;
    private final EventTicketR2dbcRepository ticketRepo;
    private final EventInvitationR2dbcRepository invitationRepo;
    private final EventEmailLogR2dbcRepository emailLogRepo;

    // ─── Event CRUD ───────────────────────────────────────────────────────────

    @Override
    public Mono<Event> createEvent(Event eventData) {
        eventData.setCreatedAt(LocalDateTime.now());
        eventData.setIsPublished(false);
        eventData.setInterestedCount(0);
        return eventRepo.save(eventData);
    }

    @Override
    public Mono<Event> updateEvent(Long eventId, Event eventData) {
        return eventRepo.findById(eventId)
                .flatMap(existing -> {
                    existing.setTitle(eventData.getTitle());
                    existing.setDescription(eventData.getDescription());
                    existing.setBannerUrl(eventData.getBannerUrl());
                    existing.setLocation(eventData.getLocation());
                    existing.setStartTime(eventData.getStartTime());
                    existing.setEndTime(eventData.getEndTime());
                    existing.setRegistrationStartAt(eventData.getRegistrationStartAt());
                    existing.setRegistrationEndAt(eventData.getRegistrationEndAt());
                    existing.setMaxCapacity(eventData.getMaxCapacity());
                    if (eventData.getTopic() != null) existing.setTopic(eventData.getTopic());
                    return eventRepo.save(existing);
                });
    }

    @Override
    public Mono<Boolean> deleteEvent(Long eventId) {
        return eventRepo.deleteById(eventId).thenReturn(true);
    }

    @Override
    public Mono<Event> findEventById(Long eventId) {
        return eventRepo.findById(eventId);
    }

    @Override
    public Mono<PaginatedResponse<Event>> findEventsByOrganization(Long organizationId, int page, int limit) {
        int offset = page * limit;
        return eventRepo.findByOrganizationIdWithPagination(organizationId, limit, offset)
                .collectList()
                .zipWith(eventRepo.countByOrganizationId(organizationId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    // ─── Publishing ───────────────────────────────────────────────────────────

    @Override
    public Mono<Event> publishEvent(Long eventId) {
        return eventRepo.publishEvent(eventId).then(eventRepo.findById(eventId));
    }

    @Override
    public Mono<Event> unpublishEvent(Long eventId) {
        return eventRepo.unpublishEvent(eventId).then(eventRepo.findById(eventId));
    }

    // ─── Search & Filter ──────────────────────────────────────────────────────

    @Override
    public Mono<PaginatedResponse<Event>> findUpcomingEvents(Long organizationId, int page, int limit) {
        int offset = page * limit;
        LocalDateTime now = LocalDateTime.now();
        return eventRepo.findUpcomingEvents(organizationId, now, limit, offset)
                .collectList()
                .zipWith(eventRepo.countUpcomingEvents(organizationId, now))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<PaginatedResponse<Event>> findPastEvents(Long organizationId, int page, int limit) {
        int offset = page * limit;
        LocalDateTime now = LocalDateTime.now();
        return eventRepo.findPastEvents(organizationId, now, limit, offset)
                .collectList()
                .zipWith(eventRepo.countPastEvents(organizationId, now))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<PaginatedResponse<Event>> searchEvents(Long organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        return eventRepo.searchEvents(organizationId, keyword, limit, offset)
                .collectList()
                .zipWith(eventRepo.countSearchEvents(organizationId, keyword))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    // ─── Interest ─────────────────────────────────────────────────────────────

    @Override
    public Mono<EventInterest> addEventInterest(Long eventId, Long memberId) {
        EventInterest interest = EventInterest.builder()
                .eventId(eventId)
                .memberId(memberId)
                .createdAt(LocalDateTime.now())
                .build();
        return interestRepo.save(interest)
                .flatMap(saved -> eventRepo.incrementInterestedCount(eventId).thenReturn(saved));
    }

    @Override
    public Mono<Boolean> removeEventInterest(Long eventId, Long memberId) {
        return interestRepo.deleteByEventIdAndMemberId(eventId, memberId)
                .then(eventRepo.decrementInterestedCount(eventId))
                .thenReturn(true);
    }

    @Override
    public Mono<PaginatedResponse<EventInterest>> findEventInterests(Long eventId, int page, int limit) {
        int offset = page * limit;
        return interestRepo.findByEventIdWithPagination(eventId, limit, offset)
                .collectList()
                .zipWith(interestRepo.countByEventId(eventId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<Boolean> checkUserInterest(Long eventId, Long memberId) {
        return interestRepo.existsByEventIdAndMemberId(eventId, memberId);
    }

    @Override
    public Mono<Event> updateInterestedCount(Long eventId, Boolean increment) {
        Mono<Integer> updateMono = increment
                ? eventRepo.incrementInterestedCount(eventId)
                : eventRepo.decrementInterestedCount(eventId);
        return updateMono.then(eventRepo.findById(eventId));
    }

    // ─── Ticket — register ────────────────────────────────────────────────────

    @Override
    public Mono<EventTicket> registerTicket(EventTicket ticketData) {
        ticketData.setTicketCode(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        ticketData.setStatus(Status.PENDING);
        ticketData.setRegisteredAt(LocalDateTime.now());
        return ticketRepo.save(ticketData);
    }

    @Override
    public Mono<Boolean> hasRegistered(Long eventId, Long memberId) {
        return ticketRepo.existsByEventIdAndMemberId(eventId, memberId);
    }

    // ─── Ticket — admin approve / reject ─────────────────────────────────────

    @Override
    public Mono<EventTicket> approveTicket(Long ticketId, Long reviewedBy) {
        return ticketRepo.approveTicket(ticketId, reviewedBy, LocalDateTime.now())
                .then(ticketRepo.findById(ticketId));
    }

    @Override
    public Mono<EventTicket> rejectTicket(Long ticketId, Long reviewedBy, String reason) {
        return ticketRepo.rejectTicket(ticketId, reviewedBy, LocalDateTime.now(), reason)
                .then(ticketRepo.findById(ticketId));
    }

    @Override
    public Mono<Integer> approveAllPendingTickets(Long eventId, Long reviewedBy) {
        return ticketRepo.approveAllPendingTickets(eventId, reviewedBy, LocalDateTime.now());
    }

    // ─── Ticket — issue ───────────────────────────────────────────────────────

    @Override
    public Flux<EventTicket> findIssuedTicketsByEvent(Long eventId) {
        return ticketRepo.findIssuedTicketsByEventId(eventId);
    }

    // ─── Ticket — lifecycle ───────────────────────────────────────────────────

    @Override
    public Mono<EventTicket> cancelTicket(Long ticketId) {
        return ticketRepo.cancelTicket(ticketId).then(ticketRepo.findById(ticketId));
    }

    @Override
    public Mono<EventTicket> checkInTicket(Long ticketId) {
        return ticketRepo.checkInTicket(ticketId, LocalDateTime.now())
                .then(ticketRepo.findById(ticketId));
    }

    @Override
    public Mono<Integer> activateTicketsForEvent(Long eventId) {
        return ticketRepo.activateTicketsForEvent(eventId);
    }

    @Override
    public Mono<Integer> expireTicketsForEvent(Long eventId) {
        return ticketRepo.expireTicketsForEvent(eventId);
    }

    // ─── Ticket — query ───────────────────────────────────────────────────────

    @Override
    public Mono<EventTicket> findTicketByCode(String ticketCode) {
        return ticketRepo.findByTicketCode(ticketCode);
    }

    @Override
    public Mono<EventTicket> findTicketById(Long ticketId) {
        return ticketRepo.findById(ticketId);
    }

    @Override
    public Mono<PaginatedResponse<EventTicket>> findTicketsByEvent(Long eventId, int page, int limit) {
        int offset = page * limit;
        return ticketRepo.findByEventIdWithPagination(eventId, limit, offset)
                .collectList()
                .zipWith(ticketRepo.countByEventId(eventId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<PaginatedResponse<EventTicket>> findTicketsByEventAndStatus(Long eventId, String status, int page, int limit) {
        int offset = page * limit;
        return ticketRepo.findByEventIdAndStatusWithPagination(eventId, status, limit, offset)
                .collectList()
                .zipWith(ticketRepo.countByEventIdAndStatus(eventId, status))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<PaginatedResponse<EventTicket>> findTicketsByMember(Long memberId, int page, int limit) {
        int offset = page * limit;
        return ticketRepo.findByMemberIdWithPagination(memberId, limit, offset)
                .collectList()
                .zipWith(ticketRepo.countByMemberId(memberId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<Long> countRegisteredTickets(Long eventId) {
        return ticketRepo.countByEventIdAndStatus(eventId, Status.PENDING.getValue());
    }

    // ─── Invitations ──────────────────────────────────────────────────────────

    @Override
    public Mono<EventInvitation> createInvitation(EventInvitation invitation) {
        invitation.setStatus(Status.PENDING);
        invitation.setInvitedAt(LocalDateTime.now());
        return invitationRepo.save(invitation);
    }

    @Override
    public Mono<EventInvitation> findInvitationByToken(String token) {
        return invitationRepo.findByToken(token);
    }

    @Override
    public Mono<EventInvitation> confirmInvitation(Long invitationId) {
        return invitationRepo.confirmInvitation(invitationId, LocalDateTime.now())
                .then(invitationRepo.findById(invitationId));
    }

    @Override
    public Mono<EventInvitation> declineInvitation(Long invitationId) {
        return invitationRepo.declineInvitation(invitationId)
                .then(invitationRepo.findById(invitationId));
    }

    @Override
    public Mono<Boolean> hasInvitation(Long eventId, Long memberId) {
        return invitationRepo.existsByEventIdAndMemberId(eventId, memberId);
    }

    @Override
    public Mono<PaginatedResponse<EventInvitation>> findInvitationsByEvent(Long eventId, int page, int limit) {
        int offset = page * limit;
        return invitationRepo.findByEventIdWithPagination(eventId, limit, offset)
                .collectList()
                .zipWith(invitationRepo.countByEventId(eventId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    // ─── Email logs ───────────────────────────────────────────────────────────

    @Override
    public Mono<EventEmailLog> saveEmailLog(EventEmailLog log) {
        log.setSentAt(LocalDateTime.now());
        return emailLogRepo.save(log);
    }

    @Override
    public Mono<PaginatedResponse<EventEmailLog>> findEmailLogsByEvent(Long eventId, int page, int limit) {
        int offset = page * limit;
        return emailLogRepo.findByEventIdWithPagination(eventId, limit, offset)
                .collectList()
                .zipWith(emailLogRepo.countByEventId(eventId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    // ─── Statistics ───────────────────────────────────────────────────────────

    @Override
    public Mono<EventStatisticsResponse> getEventStatistics(Long eventId) {
        return eventRepo.findById(eventId)
                .zipWith(ticketRepo.countByEventIdAndStatus(eventId, Status.PENDING.getValue()))
                .zipWith(ticketRepo.countByEventIdAndStatus(eventId, Status.ISSUED.getValue()))
                .zipWith(ticketRepo.countByEventIdAndStatus(eventId, Status.CHECKED_IN.getValue()))
                .map(tuple -> {
                    Event event = tuple.getT1().getT1().getT1();
                    Long pendingCount = tuple.getT1().getT1().getT2();
                    Long issuedCount = tuple.getT1().getT2();
                    Long checkedInCount = tuple.getT2();
                    long total = pendingCount + issuedCount + checkedInCount;

                    return EventStatisticsResponse.builder()
                            .eventId(eventId)
                            .interestedCount(event.getInterestedCount())
                            .registeredCount(total)
                            .checkedInCount(checkedInCount)
                            .maxCapacity(event.getMaxCapacity())
                            .availableSlots(event.getMaxCapacity() != null
                                    ? event.getMaxCapacity() - total
                                    : null)
                            .build();
                });
    }
}
