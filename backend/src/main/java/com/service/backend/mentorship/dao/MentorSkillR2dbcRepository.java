package com.service.backend.mentorship.dao;

import com.service.backend.shared.entity.MentorSkill;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
@Repository
public interface MentorSkillR2dbcRepository extends R2dbcRepository<MentorSkill, Integer> {

    @Query("SELECT * FROM mentor_skills WHERE mentor_member_id = :mentorMemberId ORDER BY display_order ASC")
    Flux<MentorSkill> findByMentorMemberIdOrderByDisplayOrder(Integer mentorMemberId);

    @Query("SELECT * FROM mentor_skills WHERE mentor_member_id IN (:mentorMemberIds) ORDER BY mentor_member_id ASC, display_order ASC")
    Flux<MentorSkill> findByMentorMemberIdsOrderByDisplayOrder(java.util.Collection<Integer> mentorMemberIds);

    @Modifying
    @Query("DELETE FROM mentor_skills WHERE mentor_member_id = :mentorMemberId")
    Mono<Void> deleteByMentorMemberId(Integer mentorMemberId);
}
