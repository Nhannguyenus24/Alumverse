package com.service.backend.event.dao;

import com.service.backend.shared.entity.Event;
import com.service.backend.shared.entity.EventInterest;
import com.service.backend.shared.entity.EventTicket;
import com.service.backend.shared.enums.Status;
import com.service.backend.event.dto.EventStatisticsResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class EventRepository implements IEventRepository {

    private final EventR2dbcRepository eventRepo;
    private final EventInterestR2dbcRepository interestRepo;
    private final EventTicketR2dbcRepository ticketRepo;

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

    @Override
    public Mono<Event> publishEvent(Long eventId) {
        return eventRepo.publishEvent(eventId)
                .then(eventRepo.findById(eventId));
    }

    @Override
    public Mono<Event> unpublishEvent(Long eventId) {
        return eventRepo.unpublishEvent(eventId)
                .then(eventRepo.findById(eventId));
    }

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

    @Override
    public Mono<EventTicket> registerTicket(EventTicket ticketData) {
        ticketData.setTicketCode(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        ticketData.setStatus(Status.REGISTERED);
        ticketData.setRegisteredAt(LocalDateTime.now());
        return ticketRepo.save(ticketData);
    }

    @Override
    public Mono<EventTicket> cancelTicket(Long ticketId) {
        return ticketRepo.cancelTicket(ticketId)
                .then(ticketRepo.findById(ticketId));
    }

    @Override
    public Mono<EventTicket> checkInTicket(Long ticketId) {
        return ticketRepo.checkInTicket(ticketId, LocalDateTime.now())
                .then(ticketRepo.findById(ticketId));
    }

    @Override
    public Mono<EventTicket> findTicketByCode(String ticketCode) {
        return ticketRepo.findByTicketCode(ticketCode);
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
    public Mono<PaginatedResponse<EventTicket>> findTicketsByMember(Long memberId, int page, int limit) {
        int offset = page * limit;
        return ticketRepo.findByMemberIdWithPagination(memberId, limit, offset)
                .collectList()
                .zipWith(ticketRepo.countByMemberId(memberId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<Long> countRegisteredTickets(Long eventId) {
        return ticketRepo.countByEventIdAndStatus(eventId, Status.REGISTERED.getValue());
    }

    @Override
    public Mono<EventStatisticsResponse> getEventStatistics(Long eventId) {
        return eventRepo.findById(eventId)
                .zipWith(ticketRepo.countByEventIdAndStatus(eventId, Status.REGISTERED.getValue()))
                .zipWith(ticketRepo.countByEventIdAndStatus(eventId, Status.CHECKED_IN.getValue()))
                .map(tuple -> {
                    Event event = tuple.getT1().getT1();
                    Long registeredCount = tuple.getT1().getT2();
                    Long checkedInCount = tuple.getT2();

                    return EventStatisticsResponse.builder()
                            .eventId(eventId)
                            .interestedCount(event.getInterestedCount())
                            .registeredCount(registeredCount)
                            .checkedInCount(checkedInCount)
                            .maxCapacity(event.getMaxCapacity())
                            .availableSlots(event.getMaxCapacity() != null ? event.getMaxCapacity() - registeredCount : null)
                            .build();
                });
    }
}
    
