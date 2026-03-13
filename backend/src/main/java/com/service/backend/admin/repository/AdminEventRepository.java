package com.service.backend.admin.repository;

import com.service.backend.eventmodule.domain.entity.Event;
import com.service.backend.eventmodule.domain.entity.EventInterest;
import com.service.backend.eventmodule.domain.entity.EventTicket;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Admin-specific repository interface for event data access.
 * Focuses on pure data access operations for admin functionality.
 * Business logic operations (cancel, check-in, publish, etc.) should be handled in service layer.
 */
public interface AdminEventRepository {

    // ========== EVENT QUERIES ==========

    /**
     * Get all events in the system with pagination (admin access - no organization filtering)
     */
    Flux<Event> findAllEvents();

    /**
     * Get events by status
     */
    Flux<Event> findEventsByStatus(String status);

    /**
     * Count all events
     */
    Mono<Long> countAllEvents();

    /**
     * Count events by status
     */
    Mono<Long> countEventsByStatus(String status);

    /**
     * Find event by id
     */
    Mono<Event> findEventById(Long eventId);

    /**
     * Save or update event
     */
    Mono<Event> saveEvent(Event event);

    /**
     * Delete event by id
     */
    Mono<Void> deleteEvent(Long eventId);

    /**
     * Delete multiple events in bulk
     */
    Mono<Integer> deleteEventsBulk(List<Long> eventIds);

    /**
     * Update event status
     */
    Mono<Event> updateEventStatus(Long eventId, String status);

    // ========== EVENT INTEREST QUERIES ==========

    /**
     * Find all event interests by event id
     */
    Flux<EventInterest> findInterestsByEventId(Long eventId);

    /**
     * Find event interests by user id
     */
    Flux<EventInterest> findInterestsByUserId(Long userId);

    /**
     * Find event interest by event and user id
     */
    Mono<EventInterest> findEventInterest(Long eventId, Long userId);

    /**
     * Count interests for event
     */
    Mono<Long> countInterestsByEventId(Long eventId);

    /**
     * Save or update event interest
     */
    Mono<EventInterest> saveEventInterest(EventInterest interest);

    /**
     * Delete event interest
     */
    Mono<Void> deleteEventInterest(Long eventId, Long userId);

    /**
     * Delete all interests for event
     */
    Mono<Integer> deleteInterestsByEventId(Long eventId);

    // ========== EVENT TICKET QUERIES ==========

    /**
     * Find all tickets by event id
     */
    Flux<EventTicket> findTicketsByEventId(Long eventId);

    /**
     * Find ticket by code
     */
    Mono<EventTicket> findTicketByCode(String ticketCode);

    /**
     * Find ticket by id
     */
    Mono<EventTicket> findTicketById(Long ticketId);

    /**
     * Find all tickets by user id
     */
    Flux<EventTicket> findTicketsByUserId(Long userId);

    /**
     * Count tickets for event
     */
    Mono<Long> countTicketsByEventId(Long eventId);

    /**
     * Count tickets by status
     */
    Mono<Long> countTicketsByStatus(Long eventId, String status);

    /**
     * Save or update ticket
     */
    Mono<EventTicket> saveTicket(EventTicket ticket);

    /**
     * Update ticket status
     */
    Mono<EventTicket> updateTicketStatus(Long ticketId, String status);

    /**
     * Delete ticket by id
     */
    Mono<Void> deleteTicket(Long ticketId);

    /**
     * Delete multiple tickets in bulk
     */
    Mono<Integer> deleteTicketsBulk(List<Long> ticketIds);

}
