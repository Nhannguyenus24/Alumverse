package com.service.backend.mentorship.dao;

import com.service.backend.shared.entity.MentorProfile;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MentorProfileR2dbcRepository extends R2dbcRepository<MentorProfile, Integer> {

    // ===================== Basic paginated =====================

    @Query("SELECT DISTINCT mp.member_id, mp.current_job_title, mp.current_company, " +
            "mp.rating_avg, mp.total_sessions, mp.status, mp.review_note, mp.reviewed_at, " +
            "mp.reviewed_by, mp.default_meeting_link, mp.booking_window_settings, " +
            "mp.extended_profile, mp.created_at, mp.updated_at " +
            "FROM mentor_profiles mp " +
            "LEFT JOIN organization_members om ON mp.member_id = om.user_id " +
            "WHERE mp.status = 'APPROVED' " +
            "AND (:organizationId IS NULL OR om.organization_id = :organizationId) " +
            "ORDER BY mp.rating_avg DESC LIMIT :limit OFFSET :offset")
    Flux<MentorProfile> findApprovedMentors(Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(DISTINCT mp.member_id) FROM mentor_profiles mp " +
            "LEFT JOIN organization_members om ON mp.member_id = om.user_id " +
            "WHERE mp.status = 'APPROVED' " +
            "AND (:organizationId IS NULL OR om.organization_id = :organizationId)")
    Mono<Long> countApprovedMentors(Integer organizationId);

    @Query("SELECT DISTINCT mp.member_id, mp.current_job_title, mp.current_company, " +
            "mp.rating_avg, mp.total_sessions, mp.status, mp.review_note, mp.reviewed_at, " +
            "mp.reviewed_by, mp.default_meeting_link, mp.booking_window_settings, " +
            "mp.extended_profile, mp.created_at, mp.updated_at " +
            "FROM mentor_profiles mp " +
            "LEFT JOIN organization_members om ON mp.member_id = om.user_id " +
            "WHERE mp.member_id = :memberId " +
            "AND mp.status = 'APPROVED' " +
            "AND (:organizationId IS NULL OR om.organization_id = :organizationId) " +
            "LIMIT 1")
    Mono<MentorProfile> findApprovedMentor(Integer memberId, Integer organizationId);

    @Query("SELECT * FROM mentor_profiles ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorProfile> findAllWithPagination(int limit, int offset);

    @Query("SELECT COUNT(*) FROM mentor_profiles")
    Mono<Long> countAll();

    // ===================== Search by keyword =====================

    // ===================== Combined filter =====================

    @Query("SELECT DISTINCT mp.member_id, mp.current_job_title, mp.current_company, " +
            "mp.rating_avg, mp.total_sessions, mp.status, mp.review_note, mp.reviewed_at, " +
            "mp.reviewed_by, mp.default_meeting_link, mp.booking_window_settings, " +
            "mp.extended_profile, mp.created_at, mp.updated_at " +
            "FROM mentor_profiles mp " +
            "LEFT JOIN mentor_availabilities ma ON mp.member_id = ma.mentor_member_id " +
            "LEFT JOIN organization_members om ON mp.member_id = om.user_id " +
            "LEFT JOIN users gp ON gp.id = om.user_id " +
            "WHERE mp.status = 'APPROVED' " +
            "AND (:organizationId IS NULL OR om.organization_id = :organizationId) " +
            "AND (:search IS NULL OR LOWER(mp.current_job_title) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(mp.current_company) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(gp.full_name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR EXISTS (SELECT 1 FROM mentor_expertise me WHERE me.mentor_member_id = mp.member_id " +
            "         AND (LOWER(me.topic) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "           OR LOWER(me.category) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "           OR LOWER(me.tag) LIKE LOWER(CONCAT('%', :search, '%')))) " +
            "     OR EXISTS (SELECT 1 FROM mentor_skills ms JOIN skills s ON s.id = ms.skill_id " +
            "         WHERE ms.mentor_member_id = mp.member_id AND LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')))) " +
            "AND (:hasSkillFilter = false OR mp.member_id IN " +
            "     (SELECT ms.mentor_member_id FROM mentor_skills ms WHERE ms.skill_id IN (:skillIds))) " +
            "AND (:minRating IS NULL OR mp.rating_avg >= :minRating) " +
            "AND (:hasAvailability = false OR (ma.status = 'AVAILABLE' AND ma.start_time > NOW())) " +
            "AND (:availableFrom IS NULL OR (ma.status = 'AVAILABLE' AND ma.end_time > :availableFrom)) " +
            "AND (:availableTo IS NULL OR (ma.status = 'AVAILABLE' AND ma.start_time < :availableTo)) " +
            "ORDER BY mp.rating_avg DESC LIMIT :limit OFFSET :offset")
    Flux<MentorProfile> filterMentors(Integer organizationId, String search, boolean hasSkillFilter, List<Integer> skillIds, BigDecimal minRating,
                                      boolean hasAvailability,
                                      LocalDateTime availableFrom, LocalDateTime availableTo,
                                      int limit, int offset);

    @Query("SELECT COUNT(DISTINCT mp.member_id) FROM mentor_profiles mp " +
            "LEFT JOIN mentor_availabilities ma ON mp.member_id = ma.mentor_member_id " +
            "LEFT JOIN organization_members om ON mp.member_id = om.user_id " +
            "LEFT JOIN users gp ON gp.id = om.user_id " +
            "WHERE mp.status = 'APPROVED' " +
            "AND (:organizationId IS NULL OR om.organization_id = :organizationId) " +
            "AND (:search IS NULL OR LOWER(mp.current_job_title) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(mp.current_company) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(gp.full_name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR EXISTS (SELECT 1 FROM mentor_expertise me WHERE me.mentor_member_id = mp.member_id " +
            "         AND (LOWER(me.topic) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "           OR LOWER(me.category) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "           OR LOWER(me.tag) LIKE LOWER(CONCAT('%', :search, '%')))) " +
            "     OR EXISTS (SELECT 1 FROM mentor_skills ms JOIN skills s ON s.id = ms.skill_id " +
            "         WHERE ms.mentor_member_id = mp.member_id AND LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')))) " +
            "AND (:hasSkillFilter = false OR mp.member_id IN " +
            "     (SELECT ms.mentor_member_id FROM mentor_skills ms WHERE ms.skill_id IN (:skillIds))) " +
            "AND (:minRating IS NULL OR mp.rating_avg >= :minRating) " +
            "AND (:hasAvailability = false OR (ma.status = 'AVAILABLE' AND ma.start_time > NOW())) " +
            "AND (:availableFrom IS NULL OR (ma.status = 'AVAILABLE' AND ma.end_time > :availableFrom)) " +
            "AND (:availableTo IS NULL OR (ma.status = 'AVAILABLE' AND ma.start_time < :availableTo))")
    Mono<Long> countFilterMentors(Integer organizationId, String search, boolean hasSkillFilter, List<Integer> skillIds, BigDecimal minRating,
                                  boolean hasAvailability,
                                  LocalDateTime availableFrom, LocalDateTime availableTo);

    @Query("SELECT DISTINCT mp.member_id, mp.current_job_title, mp.current_company, " +
            "mp.rating_avg, mp.total_sessions, mp.status, mp.review_note, mp.reviewed_at, " +
            "mp.reviewed_by, mp.default_meeting_link, mp.booking_window_settings, " +
            "mp.extended_profile, mp.created_at, mp.updated_at " +
            "FROM mentor_profiles mp " +
            "LEFT JOIN organization_members om ON mp.member_id = om.user_id " +
            "LEFT JOIN users gp ON gp.id = om.user_id " +
            "WHERE mp.status = 'APPROVED' " +
            "AND (:organizationId IS NULL OR om.organization_id = :organizationId) " +
            "AND (LOWER(mp.current_job_title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR LOWER(mp.current_company) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR LOWER(gp.full_name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR EXISTS (SELECT 1 FROM mentor_expertise me WHERE me.mentor_member_id = mp.member_id " +
            "         AND (LOWER(me.topic) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "           OR LOWER(me.category) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "           OR LOWER(me.tag) LIKE LOWER(CONCAT('%', :keyword, '%')))) " +
            "     OR EXISTS (SELECT 1 FROM mentor_skills ms JOIN skills s ON s.id = ms.skill_id " +
            "         WHERE ms.mentor_member_id = mp.member_id AND LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')))) " +
            "ORDER BY mp.rating_avg DESC LIMIT :limit OFFSET :offset")
    Flux<MentorProfile> searchMentorsWithName(Integer organizationId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(DISTINCT mp.member_id) FROM mentor_profiles mp " +
            "LEFT JOIN organization_members om ON mp.member_id = om.user_id " +
            "LEFT JOIN users gp ON gp.id = om.user_id " +
            "WHERE mp.status = 'APPROVED' " +
            "AND (:organizationId IS NULL OR om.organization_id = :organizationId) " +
            "AND (LOWER(mp.current_job_title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR LOWER(mp.current_company) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR LOWER(gp.full_name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR EXISTS (SELECT 1 FROM mentor_expertise me WHERE me.mentor_member_id = mp.member_id " +
            "         AND (LOWER(me.topic) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "           OR LOWER(me.category) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "           OR LOWER(me.tag) LIKE LOWER(CONCAT('%', :keyword, '%')))) " +
            "     OR EXISTS (SELECT 1 FROM mentor_skills ms JOIN skills s ON s.id = ms.skill_id " +
            "         WHERE ms.mentor_member_id = mp.member_id AND LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%'))))")
    Mono<Long> countSearchMentorsWithName(Integer organizationId, String keyword);

    // ===================== Status transitions (admin) =====================

    @Modifying
    @Query("UPDATE mentor_profiles SET status = :status, updated_at = NOW() WHERE member_id = :memberId")
    Mono<Integer> updateStatus(Integer memberId, String status);

    @Modifying
    @Query("UPDATE mentor_profiles SET status = :status, review_note = :reviewNote, reviewed_by = :reviewedBy, " +
            "reviewed_at = NOW(), updated_at = NOW() WHERE member_id = :memberId")
    Mono<Integer> applyReview(Integer memberId, String status, String reviewNote, Integer reviewedBy);

    @Modifying
    @Query("UPDATE mentor_profiles SET status = 'APPROVED', review_note = NULL, reviewed_by = :reviewedBy, " +
            "reviewed_at = NOW(), updated_at = NOW() WHERE member_id = :memberId")
    Mono<Integer> approveMentorByReviewer(Integer memberId, Integer reviewedBy);

    @Modifying
    @Query("UPDATE mentor_profiles SET rating_avg = :ratingAvg WHERE member_id = :memberId")
    Mono<Integer> updateRating(Integer memberId, BigDecimal ratingAvg);

    @Modifying
    @Query("UPDATE mentor_profiles SET total_sessions = total_sessions + 1 WHERE member_id = :memberId")
    Mono<Integer> incrementTotalSessions(Integer memberId);
}
