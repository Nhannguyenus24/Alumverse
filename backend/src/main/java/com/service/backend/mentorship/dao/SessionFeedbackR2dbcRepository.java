package com.service.backend.mentorship.dao;

import com.service.backend.shared.entity.SessionFeedback;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

@Repository
public interface SessionFeedbackR2dbcRepository extends ReactiveCrudRepository<SessionFeedback, Integer> {

    @Query("SELECT * FROM session_feedbacks WHERE session_id = :sessionId")
    Mono<SessionFeedback> findBySessionId(Integer sessionId);

    @Query("SELECT * FROM session_feedbacks WHERE session_id IN (:sessionIds)")
    Flux<SessionFeedback> findBySessionIds(Collection<Integer> sessionIds);

    @Query("SELECT sf.* FROM session_feedbacks sf JOIN mentorship_sessions ms ON sf.session_id = ms.id JOIN mentor_availabilities ma ON ms.availability_id = ma.id WHERE ma.mentor_member_id = :mentorMemberId AND sf.is_public = true ORDER BY sf.created_at DESC LIMIT :limit OFFSET :offset")
    Flux<SessionFeedback> findPublicFeedbacksByMentorId(Integer mentorMemberId, int limit, int offset);

    @Query("SELECT COUNT(sf.*) FROM session_feedbacks sf JOIN mentorship_sessions ms ON sf.session_id = ms.id JOIN mentor_availabilities ma ON ms.availability_id = ma.id WHERE ma.mentor_member_id = :mentorMemberId AND sf.is_public = true")
    Mono<Long> countPublicFeedbacksByMentorId(Integer mentorMemberId);

    @Query("SELECT AVG(sf.rating) FROM session_feedbacks sf JOIN mentorship_sessions ms ON sf.session_id = ms.id JOIN mentor_availabilities ma ON ms.availability_id = ma.id WHERE ma.mentor_member_id = :mentorMemberId")
    Mono<java.math.BigDecimal> calculateAverageRating(Integer mentorMemberId);

    @Query("SELECT EXISTS(SELECT 1 FROM session_feedbacks WHERE session_id = :sessionId)")
    Mono<Boolean> existsBySessionId(Integer sessionId);
}
