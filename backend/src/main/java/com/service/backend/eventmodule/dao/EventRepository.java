package com.service.backend.eventmodule.dao;

import com.service.backend.eventmodule.domain.entity.Event;
import com.service.backend.eventmodule.domain.entity.EventInterest;
import com.service.backend.eventmodule.domain.entity.EventTicket;
import com.service.backend.eventmodule.domain.repository.IEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    public Mono<Map<String, Object>> findEventsByOrganization(Long organizationId, int page, int limit, Map<String, Object> filters) {
        int offset = page * limit;
        return eventRepo.findByOrganizationIdWithPagination(organizationId, limit, offset)
                .collectList()
                .zipWith(eventRepo.countByOrganizationId(organizationId))
                .map(tuple -> buildPaginatedResponse(tuple.getT1(), tuple.getT2(), page, limit, "events"));
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
    public Mono<Map<String, Object>> findUpcomingEvents(Long organizationId, int page, int limit) {
        int offset = page * limit;
        LocalDateTime now = LocalDateTime.now();
        return eventRepo.findUpcomingEvents(organizationId, now, limit, offset)
                .collectList()
                .zipWith(eventRepo.countUpcomingEvents(organizationId, now))
                .map(tuple -> buildPaginatedResponse(tuple.getT1(), tuple.getT2(), page, limit, "events"));
    }

    @Override
    public Mono<Map<String, Object>> findPastEvents(Long organizationId, int page, int limit) {
        int offset = page * limit;
        LocalDateTime now = LocalDateTime.now();
        return eventRepo.findPastEvents(organizationId, now, limit, offset)
                .collectList()
                .zipWith(eventRepo.countPastEvents(organizationId, now))
                .map(tuple -> buildPaginatedResponse(tuple.getT1(), tuple.getT2(), page, limit, "events"));
    }

    @Override
    public Mono<Map<String, Object>> searchEvents(Long organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        return eventRepo.searchEvents(organizationId, keyword, limit, offset)
                .collectList()
                .zipWith(eventRepo.countSearchEvents(organizationId, keyword))
                .map(tuple -> buildPaginatedResponse(tuple.getT1(), tuple.getT2(), page, limit, "events"));
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
    public Mono<Map<String, Object>> findEventInterests(Long eventId, int page, int limit) {
        int offset = page * limit;
        return interestRepo.findByEventIdWithPagination(eventId, limit, offset)
                .collectList()
                .zipWith(interestRepo.countByEventId(eventId))
                .map(tuple -> buildPaginatedResponse(tuple.getT1(), tuple.getT2(), page, limit, "interests"));
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
        ticketData.setStatus("REGISTERED");
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
    public Mono<Map<String, Object>> findTicketsByEvent(Long eventId, int page, int limit) {
        int offset = page * limit;
        return ticketRepo.findByEventIdWithPagination(eventId, limit, offset)
                .collectList()
                .zipWith(ticketRepo.countByEventId(eventId))
                .map(tuple -> buildPaginatedResponse(tuple.getT1(), tuple.getT2(), page, limit, "tickets"));
    }

    @Override
    public Mono<Map<String, Object>> findTicketsByMember(Long memberId, int page, int limit) {
        int offset = page * limit;
        return ticketRepo.findByMemberIdWithPagination(memberId, limit, offset)
                .collectList()
                .zipWith(ticketRepo.countByMemberId(memberId))
                .map(tuple -> buildPaginatedResponse(tuple.getT1(), tuple.getT2(), page, limit, "tickets"));
    }

    private static final String STATUS_REGISTERED = "REGISTERED";
    private static final String STATUS_CHECKED_IN = "CHECKED_IN";

    @Override
    public Mono<Long> countRegisteredTickets(Long eventId) {
        return ticketRepo.countByEventIdAndStatus(eventId, STATUS_REGISTERED);
    }

    @Override
    public Mono<Map<String, Object>> getEventStatistics(Long eventId) {
        return eventRepo.findById(eventId)
                .zipWith(ticketRepo.countByEventIdAndStatus(eventId, STATUS_REGISTERED))
                .zipWith(ticketRepo.countByEventIdAndStatus(eventId, STATUS_CHECKED_IN))
                .map(tuple -> {
                    Event event = tuple.getT1().getT1();
                    Long registeredCount = tuple.getT1().getT2();
                    Long checkedInCount = tuple.getT2();

                    Map<String, Object> stats = new HashMap<>();
                    stats.put("eventId", eventId);
                    stats.put("interestedCount", event.getInterestedCount());
                    stats.put("registeredCount", registeredCount);
                    stats.put("checkedInCount", checkedInCount);
                    stats.put("maxCapacity", event.getMaxCapacity());
                    stats.put("availableSlots", event.getMaxCapacity() != null ? event.getMaxCapacity() - registeredCount : null);
                    return stats;
                });
    }

     private <T> Map<String, Object> buildPaginatedResponse(List<T> items, Long total, int page, int limit, String key) {
        Map<String, Object> result = new HashMap<>();
        result.put(key, items);
        result.put("total", total);
        result.put("page", page);
        result.put("limit", limit);
        return result;
    }
}
