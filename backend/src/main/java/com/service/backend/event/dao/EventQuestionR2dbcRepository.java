package com.service.backend.event.dao;

import com.service.backend.shared.entity.EventQuestion;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface EventQuestionR2dbcRepository extends R2dbcRepository<EventQuestion, Integer> {

    @Query("SELECT * FROM event_questions WHERE event_id = :eventId ORDER BY order_index ASC, id ASC")
    Flux<EventQuestion> findByEventIdOrderByOrderIndex(Long eventId);

    @Modifying
    @Query("DELETE FROM event_questions WHERE id = :questionId AND event_id = :eventId")
    Mono<Integer> deleteByIdAndEventId(Integer questionId, Long eventId);
}
