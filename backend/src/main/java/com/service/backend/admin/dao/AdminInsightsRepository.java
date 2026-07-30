package com.service.backend.admin.dao;

import com.service.backend.shared.entity.Event;
import com.service.backend.shared.projection.DailyCountProjection;
import com.service.backend.shared.projection.KeyCountProjection;
import com.service.backend.shared.projection.OrgComparisonProjection;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Read-only aggregation queries powering the admin dashboard insight charts
 * (funnels, cohorts, engagement, platform health). Bound to {@link Event} only to
 * satisfy the R2dbc contract — every method uses an explicit projection query.
 */
@Repository
public interface AdminInsightsRepository extends R2dbcRepository<Event, Long> {

    // ============================ Funnels ============================

    @Query("SELECT CAST(verification_level AS text) AS key, COUNT(*) AS count " +
           "FROM organization_members WHERE status = 'ACTIVE' " +
           "GROUP BY verification_level ORDER BY verification_level")
    Flux<KeyCountProjection> verificationLevelDistribution();

    @Query("SELECT COALESCE(SUM(interested_count), 0) FROM events")
    Mono<Long> sumEventInterested();

    @Query("SELECT COALESCE(SUM(max_capacity), 0) FROM events")
    Mono<Long> sumEventCapacity();

    // A registration only counts when the ticket is in a live state, mirroring the
    // canonical definition used across the event module (EventR2dbcRepository) so the
    // funnel does not inflate "registered" with REJECTED / EXPIRED / PENDING tickets.
    @Query("SELECT COUNT(*) FROM event_tickets WHERE status IN ('ISSUED', 'ACTIVE', 'USED', 'CHECKED_IN')")
    Mono<Long> countActiveTickets();

    @Query("SELECT COUNT(*) FROM event_tickets WHERE checked_in_at IS NOT NULL")
    Mono<Long> countCheckedInTickets();

    @Query("SELECT status AS key, COUNT(*) AS count FROM fund_donations GROUP BY status")
    Flux<KeyCountProjection> donationStatusDistribution();

    @Query("SELECT status AS key, COUNT(*) AS count FROM mentor_profiles GROUP BY status")
    Flux<KeyCountProjection> mentorStatusDistribution();

    @Query("SELECT status AS key, COUNT(*) AS count FROM mentorship_sessions GROUP BY status")
    Flux<KeyCountProjection> sessionStatusDistribution();

    // ============================ Cohort ============================

    // These columns are jsonb arrays (e.g. ["2019","2020"], ["GRADUATED","STUDYING"]).
    // Unnest each array element so members with multiple values are counted per value.
    // A scalar value is wrapped into a single-element array first to stay robust.
    @Query("SELECT elem AS key, COUNT(*) AS count " +
           "FROM organization_members om " +
           "CROSS JOIN LATERAL jsonb_array_elements_text(" +
           "    CASE WHEN jsonb_typeof(om.started_year) = 'array' THEN om.started_year " +
           "         ELSE jsonb_build_array(om.started_year) END) AS elem " +
           "WHERE om.started_year IS NOT NULL " +
           "GROUP BY elem ORDER BY elem")
    Flux<KeyCountProjection> startedYearDistribution();

    @Query("SELECT elem AS key, COUNT(*) AS count " +
           "FROM organization_members om " +
           "CROSS JOIN LATERAL jsonb_array_elements_text(" +
           "    CASE WHEN jsonb_typeof(om.graduated_year) = 'array' THEN om.graduated_year " +
           "         ELSE jsonb_build_array(om.graduated_year) END) AS elem " +
           "WHERE om.graduated_year IS NOT NULL " +
           "GROUP BY elem ORDER BY elem")
    Flux<KeyCountProjection> graduatedYearDistribution();

    @Query("SELECT elem AS key, COUNT(*) AS count " +
           "FROM organization_members om " +
           "CROSS JOIN LATERAL jsonb_array_elements_text(" +
           "    CASE WHEN jsonb_typeof(om.graduation_status) = 'array' THEN om.graduation_status " +
           "         ELSE jsonb_build_array(om.graduation_status) END) AS elem " +
           "WHERE om.graduation_status IS NOT NULL " +
           "GROUP BY elem ORDER BY count DESC")
    Flux<KeyCountProjection> graduationStatusDistribution();

    @Query("SELECT COALESCE(NULLIF(gender, ''), 'unknown') AS key, COUNT(*) AS count " +
           "FROM users GROUP BY COALESCE(NULLIF(gender, ''), 'unknown') ORDER BY 2 DESC")
    Flux<KeyCountProjection> genderDistribution();

    @Query("SELECT CASE " +
           "WHEN dob IS NULL THEN 'unknown' " +
           "WHEN date_part('year', age(dob)) < 18 THEN '<18' " +
           "WHEN date_part('year', age(dob)) < 23 THEN '18-22' " +
           "WHEN date_part('year', age(dob)) < 28 THEN '23-27' " +
           "WHEN date_part('year', age(dob)) < 35 THEN '28-34' " +
           "ELSE '35+' END AS key, COUNT(*) AS count " +
           "FROM users GROUP BY key ORDER BY key")
    Flux<KeyCountProjection> ageBucketDistribution();

    // ========================== Engagement ==========================

    @Query("SELECT COUNT(DISTINCT user_id) FROM user_login_histories " +
           "WHERE login_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'")
    Mono<Long> countWeeklyActive();

    @Query("SELECT COUNT(DISTINCT user_id) FROM user_login_histories " +
           "WHERE login_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'")
    Mono<Long> countMonthlyActive();

    @Query("SELECT CAST(EXTRACT(HOUR FROM login_at) AS text) AS key, COUNT(*) AS count " +
           "FROM user_login_histories WHERE login_at >= CURRENT_DATE - INTERVAL '30 days' " +
           "GROUP BY EXTRACT(HOUR FROM login_at) ORDER BY EXTRACT(HOUR FROM login_at)")
    Flux<KeyCountProjection> loginsByHour();

    // ====================== Platform: chat ===========================

    @Query("SELECT COUNT(*) FROM chat_messages WHERE deleted_at IS NULL")
    Mono<Long> countChatMessages();

    @Query("SELECT COUNT(*) FROM chat_groups")
    Mono<Long> countChatGroups();

    @Query("SELECT COUNT(*) FROM user_blocks")
    Mono<Long> countUserBlocks();

    @Query("SELECT type AS key, COUNT(*) AS count FROM chat_groups GROUP BY type")
    Flux<KeyCountProjection> chatGroupsByType();

    @Query("SELECT CAST(created_at AS DATE) AS date, COUNT(*) AS count FROM chat_messages " +
           "WHERE created_at >= CURRENT_DATE - INTERVAL '14 days' AND deleted_at IS NULL " +
           "GROUP BY CAST(created_at AS DATE) ORDER BY date")
    Flux<DailyCountProjection> chatMessagesByDay();

    @Query("SELECT status AS key, COUNT(*) AS count FROM chat_conversation_requests GROUP BY status")
    Flux<KeyCountProjection> chatRequestsByStatus();

    // ================== Platform: org comparison =====================

    @Query("SELECT o.id AS org_id, o.name AS name, " +
           "(SELECT COUNT(*) FROM organization_members m WHERE m.organization_id = o.id AND m.status = 'ACTIVE') AS members, " +
           "(SELECT COUNT(*) FROM events e WHERE e.organization_id = o.id) AS events, " +
           "(SELECT COUNT(*) FROM forum_topics ft WHERE ft.organization_id = o.id) AS topics, " +
           "(SELECT COUNT(*) FROM jobs j WHERE j.organization_id = o.id) AS jobs " +
           "FROM organizations o ORDER BY members DESC LIMIT :limit")
    Flux<OrgComparisonProjection> orgComparison(@Param("limit") int limit);

    // ===================== Platform: quality =========================

    @Query("SELECT CAST(COALESCE(AVG(rating), 0) AS double precision) FROM session_feedbacks")
    Mono<Double> avgSessionRating();

    @Query("SELECT CAST(rating AS text) AS key, COUNT(*) AS count FROM session_feedbacks " +
           "WHERE rating IS NOT NULL GROUP BY rating ORDER BY rating")
    Flux<KeyCountProjection> sessionRatingDistribution();

    @Query("SELECT COALESCE(status, 'UNKNOWN') AS key, COUNT(*) AS count " +
           "FROM mentorship_reports GROUP BY status")
    Flux<KeyCountProjection> mentorReportsByStatus();

    @Query("SELECT COALESCE(status, 'UNKNOWN') AS key, COUNT(*) AS count " +
           "FROM forum_post_reports GROUP BY status")
    Flux<KeyCountProjection> forumReportsByStatus();
}
