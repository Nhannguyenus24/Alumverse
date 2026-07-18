package com.service.backend.admin.dao;

import com.service.backend.shared.entity.MentorProfile;
import com.service.backend.shared.entity.MentorshipSession;
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

    @Query("SELECT * FROM mentor_profiles WHERE status = :status ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorProfile> findMentorProfilesByStatus(@Param("status") String status,
                                                   @Param("limit") int limit,
                                                   @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM mentor_profiles WHERE status = :status")
    Mono<Long> countMentorProfilesByStatus(@Param("status") String status);

    @Query("SELECT * FROM mentor_profiles WHERE member_id = :memberId")
    Mono<MentorProfile> findMentorProfileById(@Param("memberId") Integer memberId);

    @Query("SELECT COUNT(*) FROM mentor_availabilities")
    Mono<Long> countAllAvailabilities();

    @Query("SELECT COUNT(*) FROM session_feedbacks")
    Mono<Long> countAllFeedbacks();

    @Query("SELECT ms.* FROM mentorship_sessions ms " +
           "JOIN mentor_availabilities ma ON ms.availability_id = ma.id " +
           "JOIN organization_members om ON ma.mentor_member_id = om.user_id " +
           "WHERE om.organization_id = :organizationId " +
           "ORDER BY ms.created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorshipSession> findSessionsByOrganization(@Param("organizationId") Integer organizationId,
                                                        @Param("limit") int limit,
                                                        @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM mentorship_sessions ms " +
           "JOIN mentor_availabilities ma ON ms.availability_id = ma.id " +
           "JOIN organization_members om ON ma.mentor_member_id = om.user_id " +
           "WHERE om.organization_id = :organizationId")
    Mono<Long> countSessionsByOrganization(@Param("organizationId") Integer organizationId);

    @Query("SELECT ms.* FROM mentorship_sessions ms " +
           "JOIN mentor_availabilities ma ON ms.availability_id = ma.id " +
           "JOIN organization_members om ON ma.mentor_member_id = om.user_id " +
           "WHERE om.organization_id = :organizationId AND ms.status = :status " +
           "ORDER BY ms.created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorshipSession> findSessionsByOrganizationAndStatus(@Param("organizationId") Integer organizationId,
                                                                 @Param("status") String status,
                                                                 @Param("limit") int limit,
                                                                 @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM mentorship_sessions ms " +
           "JOIN mentor_availabilities ma ON ms.availability_id = ma.id " +
           "JOIN organization_members om ON ma.mentor_member_id = om.user_id " +
           "WHERE om.organization_id = :organizationId AND ms.status = :status")
    Mono<Long> countSessionsByOrganizationAndStatus(@Param("organizationId") Integer organizationId,
                                                     @Param("status") String status);

    @Query("SELECT mp.* FROM mentor_profiles mp " +
           "JOIN organization_members om ON mp.member_id = om.user_id " +
           "WHERE om.organization_id = :organizationId " +
           "ORDER BY mp.created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorProfile> findMentorProfilesByOrganization(@Param("organizationId") Integer organizationId,
                                                          @Param("limit") int limit,
                                                          @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM mentor_profiles mp " +
           "JOIN organization_members om ON mp.member_id = om.user_id " +
           "WHERE om.organization_id = :organizationId")
    Mono<Long> countMentorProfilesByOrganization(@Param("organizationId") Integer organizationId);

    @Query("SELECT mp.* FROM mentor_profiles mp " +
           "JOIN organization_members om ON mp.member_id = om.user_id " +
           "WHERE om.organization_id = :organizationId AND mp.status = :status " +
           "ORDER BY mp.created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorProfile> findMentorProfilesByOrganizationAndStatus(@Param("organizationId") Integer organizationId,
                                                                    @Param("status") String status,
                                                                    @Param("limit") int limit,
                                                                    @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM mentor_profiles mp " +
           "JOIN organization_members om ON mp.member_id = om.user_id " +
           "WHERE om.organization_id = :organizationId AND mp.status = :status")
    Mono<Long> countMentorProfilesByOrganizationAndStatus(@Param("organizationId") Integer organizationId,
                                                           @Param("status") String status);

    @Query("""
        SELECT
            COUNT(*) AS total_sessions,
            SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_sessions,
            SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_sessions,
            SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_sessions,
            SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_sessions,
            SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_sessions
        FROM mentorship_sessions
    """)
    Mono<com.service.backend.admin.dto.AdminMentorshipAggregatedStatsProjection> getAggregatedMentorshipStats();

    @Query("""
        SELECT
            COUNT(*) AS total_profiles,
            SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_profiles,
            SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_profiles
        FROM mentor_profiles
    """)
    Mono<com.service.backend.admin.dto.AdminMentorProfileAggregatedStatsProjection> getAggregatedMentorProfileStats();

    @Query("""
        SELECT u.id AS member_id, u.full_name, u.email, u.status,
               COUNT(ms.id) AS total_sessions,
               SUM(CASE WHEN ms.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_sessions,
               MAX(ms.created_at) AS last_session_at
        FROM mentorship_sessions ms
        JOIN users u ON u.id = ms.mentee_member_id
        WHERE (:organizationId IS NULL OR EXISTS (
                   SELECT 1 FROM organization_members om
                   WHERE om.user_id = u.id AND om.organization_id = :organizationId))
        GROUP BY u.id, u.full_name, u.email, u.status
        ORDER BY MAX(ms.created_at) DESC
        LIMIT :limit OFFSET :offset
    """)
    Flux<com.service.backend.admin.dto.AdminMenteeProjection> findMentees(@Param("organizationId") Integer organizationId,
                                                                          @Param("limit") int limit,                                                                   @Param("offset") int offset);

    @Query("""
        SELECT COUNT(DISTINCT ms.mentee_member_id)
        FROM mentorship_sessions ms
        JOIN users u ON u.id = ms.mentee_member_id
        WHERE (:organizationId IS NULL OR EXISTS (
                   SELECT 1 FROM organization_members om
                   WHERE om.user_id = u.id AND om.organization_id = :organizationId))
    """)
    Mono<Long> countMentees(@Param("organizationId") Integer organizationId);
}
