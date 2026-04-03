package com.service.backend.mentorship.dao;

import com.service.backend.mentorship.entity.MentorExpertise;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface MentorExpertiseR2dbcRepository extends ReactiveCrudRepository<MentorExpertise, Integer> {

    @Query("SELECT * FROM mentor_expertise WHERE mentor_member_id = :mentorMemberId")
    Flux<MentorExpertise> findByMentorMemberId(Integer mentorMemberId);

    @Query("DELETE FROM mentor_expertise WHERE mentor_member_id = :mentorMemberId")
    Mono<Void> deleteByMentorMemberId(Integer mentorMemberId);

    @Query("SELECT * FROM mentor_expertise WHERE LOWER(topic) LIKE LOWER(CONCAT('%', :topic, '%'))")
    Flux<MentorExpertise> findByTopic(String topic);
}
