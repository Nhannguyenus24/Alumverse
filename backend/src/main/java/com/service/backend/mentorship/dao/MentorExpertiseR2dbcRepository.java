package com.service.backend.mentorship.dao;

import com.service.backend.shared.entity.MentorExpertise;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

@Repository
public interface MentorExpertiseR2dbcRepository extends ReactiveCrudRepository<MentorExpertise, Integer> {

    @Query("SELECT * FROM mentor_expertise WHERE mentor_member_id = :mentorMemberId")
    Flux<MentorExpertise> findByMentorMemberId(Integer mentorMemberId);

    @Query("SELECT * FROM mentor_expertise WHERE mentor_member_id IN (:mentorMemberIds)")
    Flux<MentorExpertise> findByMentorMemberIds(Collection<Integer> mentorMemberIds);

    @Query("DELETE FROM mentor_expertise WHERE mentor_member_id = :mentorMemberId")
    Mono<Void> deleteByMentorMemberId(Integer mentorMemberId);

    @Query("SELECT * FROM mentor_expertise WHERE LOWER(topic) LIKE LOWER(CONCAT('%', :topic, '%'))")
    Flux<MentorExpertise> findByTopic(String topic);

    @Query("SELECT DISTINCT topic FROM mentor_expertise " +
            "WHERE topic IS NOT NULL AND topic <> '' " +
            "ORDER BY topic")
    Flux<String> findDistinctTopics();

    @Query("SELECT DISTINCT category FROM mentor_expertise " +
            "WHERE category IS NOT NULL AND category <> '' " +
            "ORDER BY category")
    Flux<String> findDistinctCategories();
}
