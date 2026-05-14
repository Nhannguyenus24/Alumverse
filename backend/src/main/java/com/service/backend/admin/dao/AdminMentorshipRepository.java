package com.service.backend.admin.dao;

import com.service.backend.mentorship.entity.MentorProfile;
import com.service.backend.mentorship.entity.MentorshipSession;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AdminMentorshipRepository extends R2dbcRepository<MentorshipSession, Integer> {

    @Query("SELECT * FROM mentorship_sessions ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorshipSession> findAllSessions(@Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM mentorship_sessions")
    Mono<Long> countAllSessions();

    @Query("SELECT * FROM mentorship_sessions WHERE status = :status ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorshipSession> findSessionsByStatus(@Param("status") String status,
                                                 @Param("limit") int limit,
                                                 @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM mentorship_sessions WHERE status = :status")
    Mono<Long> countSessionsByStatus(@Param("status") String status);

    @Query("SELECT * FROM mentor_profiles ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorProfile> findAllMentorProfiles(@Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM mentor_profiles")
    Mono<Long> countAllMentorProfiles();

    @Query("SELECT * FROM mentor_profiles WHERE is_approved = :isApproved ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorProfile> findMentorProfilesByApproval(@Param("isApproved") Boolean isApproved,
                                                     @Param("limit") int limit,
                                                     @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM mentor_profiles WHERE is_approved = :isApproved")
    Mono<Long> countMentorProfilesByApproval(@Param("isApproved") Boolean isApproved);

    @Query("SELECT * FROM mentor_profiles WHERE member_id = :memberId")
    Mono<MentorProfile> findMentorProfileById(@Param("memberId") Integer memberId);

    @Query("SELECT COUNT(*) FROM mentor_profiles WHERE is_approved = true")
    Mono<Long> countApprovedMentors();

    @Query("SELECT COUNT(*) FROM mentor_profiles WHERE is_approved = false")
    Mono<Long> countPendingMentors();

    @Query("SELECT COUNT(*) FROM mentor_availabilities")
    Mono<Long> countAllAvailabilities();

    @Query("SELECT COUNT(*) FROM session_feedbacks")
    Mono<Long> countAllFeedbacks();
}
