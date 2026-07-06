package com.service.backend.mentorship.dao;

import com.service.backend.shared.entity.MentorSkill;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

@Repository
public interface MentorSkillR2dbcRepository extends ReactiveCrudRepository<MentorSkill, Integer> {

    @Query("SELECT * FROM mentor_skills WHERE mentor_member_id = :mentorMemberId ORDER BY display_order ASC")
    Flux<MentorSkill> findByMentorMemberIdOrderByDisplayOrder(Integer mentorMemberId);

    @Query("SELECT * FROM mentor_skills WHERE mentor_member_id IN (:mentorMemberIds) ORDER BY display_order ASC")
    Flux<MentorSkill> findByMentorMemberIds(Collection<Integer> mentorMemberIds);

    @Modifying
    @Query("DELETE FROM mentor_skills WHERE mentor_member_id = :mentorMemberId")
    Mono<Void> deleteByMentorMemberId(Integer mentorMemberId);

    @Query("SELECT DISTINCT mentor_member_id FROM mentor_skills WHERE skill_id IN (:skillIds)")
    Flux<Integer> findMentorMemberIdsBySkillIds(Collection<Integer> skillIds);
}
