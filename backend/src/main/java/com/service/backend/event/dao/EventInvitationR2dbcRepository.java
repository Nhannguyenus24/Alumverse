package com.service.backend.event.dao;

import com.service.backend.shared.entity.EventInvitation;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Repository
public interface EventInvitationR2dbcRepository extends R2dbcRepository<EventInvitation, Long> {

    Mono<EventInvitation> findByToken(String token);

    @Query("SELECT * FROM event_invitations WHERE event_id = :eventId ORDER BY invited_at DESC LIMIT :limit OFFSET :offset")
    Flux<EventInvitation> findByEventIdWithPagination(Long eventId, int limit, int offset);

    Mono<Long> countByEventId(Long eventId);

    @Modifying
    @Query("UPDATE event_invitations SET status = 'CONFIRMED', confirmed_at = :confirmedAt WHERE id = :id")
    Mono<Integer> confirmInvitation(Long id, LocalDateTime confirmedAt);
}
