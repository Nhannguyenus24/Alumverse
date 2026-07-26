package com.service.backend.event.dao;

import com.service.backend.shared.entity.EventTicket;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Repository
public interface EventTicketR2dbcRepository extends R2dbcRepository<EventTicket, Long> {

    Mono<EventTicket> findByTicketCode(String ticketCode);

    @Query("SELECT * FROM event_tickets WHERE event_id = :eventId ORDER BY registered_at DESC LIMIT :limit OFFSET :offset")
    Flux<EventTicket> findByEventIdWithPagination(Long eventId, int limit, int offset);

    @Query("""
            SELECT DISTINCT ON (COALESCE(member_id::text, guest_email)) *
            FROM event_tickets
            WHERE event_id = :eventId
            ORDER BY COALESCE(member_id::text, guest_email), registered_at DESC
            """)
    Flux<EventTicket> findLatestTicketPerOwner(Long eventId);

    Mono<Long> countByEventId(Long eventId);

    @Query("SELECT * FROM event_tickets WHERE member_id = :memberId ORDER BY registered_at DESC LIMIT :limit OFFSET :offset")
    Flux<EventTicket> findByMemberIdWithPagination(Long memberId, int limit, int offset);

    Mono<Long> countByMemberId(Long memberId);

    Mono<Long> countByEventIdAndStatus(Long eventId, String status);

    @Modifying
    @Query("UPDATE event_tickets SET status = 'CANCELLED', cancel_reason = :reason WHERE id = :ticketId")
    Mono<Integer> cancelTicket(Long ticketId, String reason);

    @Modifying
    @Query("UPDATE event_tickets SET status = 'ISSUED', cancel_reason = null, reject_reason = null WHERE id = :ticketId")
    Mono<Integer> undoTicket(Long ticketId);

    @Modifying
    @Query("UPDATE event_tickets SET status = 'BANNED', reject_reason = :reason WHERE id = :ticketId")
    Mono<Integer> banTicket(Long ticketId, String reason);


    @Modifying
    @Query("UPDATE event_tickets SET status = 'USED', checked_in_at = :checkedInAt WHERE id = :ticketId")
    Mono<Integer> checkInTicket(Long ticketId, LocalDateTime checkedInAt);

    @Modifying
    @Query("UPDATE event_tickets SET status = 'EXPIRED' WHERE id = :ticketId")
    Mono<Integer> expireTicket(Long ticketId);

    @Modifying
    @Query("""
            UPDATE event_tickets et SET status = 'EXPIRED'
            FROM events e
            WHERE et.event_id = e.id
              AND et.status = 'ISSUED'
              AND e.end_time < :now
            """)
    Mono<Integer> expireIssuedTicketsForEndedEvents(LocalDateTime now);

    @Query("""
            SELECT EXISTS(
                SELECT 1 FROM event_tickets
                WHERE event_id = :eventId AND member_id = :memberId
                  AND status NOT IN ('CANCELLED', 'EXPIRED', 'REJECTED')
            )
            """)
    Mono<Boolean> existsActiveByEventIdAndMemberId(Long eventId, Long memberId);

    @Query("""
            SELECT EXISTS(
                SELECT 1 FROM event_tickets
                WHERE event_id = :eventId AND member_id = :memberId AND status = 'BANNED'
            )
            """)
    Mono<Boolean> existsBannedByEventIdAndMemberId(Long eventId, Long memberId);

    @Query("SELECT * FROM event_tickets WHERE event_id = :eventId AND status = :status ORDER BY registered_at DESC LIMIT :limit OFFSET :offset")
    Flux<EventTicket> findByEventIdAndStatusWithPagination(Long eventId, String status, int limit, int offset);

    @Query("SELECT * FROM event_tickets WHERE event_id = :eventId AND status = 'ISSUED' ORDER BY registered_at ASC")
    Flux<EventTicket> findIssuedTicketsByEventId(Long eventId);

    @Query("""
            SELECT COUNT(*) FROM event_tickets
            WHERE event_id = :eventId
            AND status IN ('ISSUED', 'ACTIVE', 'CHECKED_IN', 'USED')
            """)
    Mono<Long> countActiveRegistrations(Long eventId);

    @Query("""
            SELECT et.* FROM event_tickets et
            LEFT JOIN users u ON et.member_id = u.id
            WHERE et.event_id = :eventId
            AND (
                LOWER(et.ticket_code) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(et.guest_name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(et.guest_email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(u.full_name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            ORDER BY et.registered_at DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<EventTicket> searchByEventId(Long eventId, String keyword, int limit, int offset);

    @Query("""
            SELECT COUNT(*) FROM event_tickets et
            LEFT JOIN users u ON et.member_id = u.id
            WHERE et.event_id = :eventId
            AND (
                LOWER(et.ticket_code) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(et.guest_name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(et.guest_email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(u.full_name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            """)
    Mono<Long> countSearchByEventId(Long eventId, String keyword);

    @Query("""
            SELECT et.* FROM event_tickets et
            LEFT JOIN users u ON et.member_id = u.id
            WHERE et.event_id = :eventId AND et.status = :status
            AND (
                LOWER(et.ticket_code) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(et.guest_name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(et.guest_email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(u.full_name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            ORDER BY et.registered_at DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<EventTicket> searchByEventIdAndStatus(Long eventId, String status, String keyword, int limit, int offset);

    @Query("""
            SELECT COUNT(*) FROM event_tickets et
            LEFT JOIN users u ON et.member_id = u.id
            WHERE et.event_id = :eventId AND et.status = :status
            AND (
                LOWER(et.ticket_code) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(et.guest_name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(et.guest_email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(u.full_name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            """)
    Mono<Long> countSearchByEventIdAndStatus(Long eventId, String status, String keyword);

    /**
     * Các thành viên đã đăng ký (ticket còn hiệu lực) cho những sự kiện sắp hết hạn đăng ký
     * trong khoảng (now, windowEnd]. Dùng để nhắc riêng nhóm đã đăng ký (khác với nhắc đăng ký).
     * DISTINCT theo member để tránh gửi trùng khi 1 người có nhiều vé cho cùng sự kiện.
     */
    @Query("""
            SELECT DISTINCT t.member_id AS member_id, e.id AS event_id, e.title AS event_title
            FROM event_tickets t JOIN events e ON e.id = t.event_id
            WHERE e.registration_end_at > :now AND e.registration_end_at <= :windowEnd
              AND t.member_id IS NOT NULL
              AND t.status IN ('ISSUED', 'ACTIVE', 'CHECKED_IN', 'USED')
            """)
    Flux<RegisteredMemberReminderProjection> findRegisteredMembersForUpcomingDeadline(LocalDateTime now, LocalDateTime windowEnd);

    interface RegisteredMemberReminderProjection {
        Long getMemberId();
        Long getEventId();
        String getEventTitle();
    }
}
