package com.service.backend.mentorship.dao;

import com.service.backend.shared.entity.MentorExpertise;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.Collection;

@Repository
public interface MentorExpertiseR2dbcRepository extends ReactiveCrudRepository<MentorExpertise, Integer> {

    @Query("SELECT * FROM mentor_expertise WHERE mentor_member_id = :mentorMemberId")
    Flux<MentorExpertise> findByMentorMemberId(Integer mentorMemberId);

    @Query("SELECT * FROM mentor_expertise WHERE mentor_member_id IN (:mentorMemberIds)")
    Flux<MentorExpertise> findByMentorMemberIds(Collection<Integer> mentorMemberIds);
}
