package com.service.backend.event.dao;

import com.service.backend.shared.entity.EventTicket;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import com.service.backend.shared.enums.Status;

@Repository
public interface EventTicketR2dbcRepository extends ReactiveCrudRepository<EventTicket, Long> {

    Mono<EventTicket> findByTicketCode(String ticketCode);

    @Query("SELECT * FROM event_tickets WHERE event_id = :eventId ORDER BY registered_at DESC LIMIT :limit OFFSET :offset")
    Flux<EventTicket> findByEventIdWithPagination(Long eventId, int limit, int offset);

    Mono<Long> countByEventId(Long eventId);

    @Query("SELECT * FROM event_tickets WHERE member_id = :memberId ORDER BY registered_at DESC LIMIT :limit OFFSET :offset")
    Flux<EventTicket> findByMemberIdWithPagination(Long memberId, int limit, int offset);

    Mono<Long> countByMemberId(Long memberId);

    Mono<Long> countByEventIdAndStatus(Long eventId, String status);

    @Modifying
    @Query("UPDATE event_tickets SET status = :status WHERE id = :ticketId")
    Mono<Integer> updateStatus(Long ticketId, Status status);

    @Modifying
    @Query("UPDATE event_tickets SET status = 'CANCELLED' WHERE id = :ticketId")
    Mono<Integer> cancelTicket(Long ticketId);

    @Modifying
    @Query("UPDATE event_tickets SET status = 'CHECKED_IN', checked_in_at = :checkedInAt WHERE id = :ticketId")
    Mono<Integer> checkInTicket(Long ticketId, LocalDateTime checkedInAt);
}
