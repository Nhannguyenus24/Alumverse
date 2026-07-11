package com.service.backend.mentorship.dao;

import com.service.backend.shared.entity.MentorAvailability;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Repository
public interface MentorAvailabilityR2dbcRepository extends ReactiveCrudRepository<MentorAvailability, Integer> {

    @Query("SELECT * FROM mentor_availabilities WHERE mentor_member_id = :mentorMemberId ORDER BY start_time ASC")
    Flux<MentorAvailability> findByMentorMemberId(Integer mentorMemberId);

    @Query("SELECT * FROM mentor_availabilities WHERE mentor_member_id = :mentorMemberId AND status = 'AVAILABLE' AND start_time > :now ORDER BY start_time ASC")
    Flux<MentorAvailability> findAvailableSlots(Integer mentorMemberId, LocalDateTime now);

    @Modifying
    @Query("UPDATE mentor_availabilities SET status = :status WHERE id = :id")
    Mono<Integer> updateStatus(Integer id, String status);

    @Modifying
    @Query("UPDATE mentor_availabilities SET start_time = :startTime, end_time = :endTime WHERE id = :id")
    Mono<Integer> updateTimes(Integer id, LocalDateTime startTime, LocalDateTime endTime);

    @Modifying
    @Query("UPDATE mentor_availabilities SET status = 'EXPIRED' WHERE status = 'AVAILABLE' AND end_time < :now")
    Mono<Integer> expireStaleAvailabilities(LocalDateTime now);

    // Two intervals [a,b) and [c,d) overlap iff a < d AND c < b.
    @Query("SELECT COUNT(*) FROM mentor_availabilities " +
            "WHERE mentor_member_id = :mentorMemberId " +
            "AND start_time < :endTime AND end_time > :startTime " +
            "AND (:excludeId IS NULL OR id <> :excludeId)")
    Mono<Long> countOverlapping(Integer mentorMemberId,
                                LocalDateTime startTime,
                                LocalDateTime endTime,
                                Integer excludeId);
}
