package com.service.backend.mentorship.dao;

import com.service.backend.shared.entity.MentorProfile;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface MentorProfileR2dbcRepository extends ReactiveCrudRepository<MentorProfile, Integer> {

    // ===================== Basic paginated =====================

    @Query("SELECT * FROM mentor_profiles WHERE status = 'APPROVED' ORDER BY rating_avg DESC LIMIT :limit OFFSET :offset")
    Flux<MentorProfile> findApprovedMentors(int limit, int offset);

    @Query("SELECT COUNT(*) FROM mentor_profiles WHERE status = 'APPROVED'")
    Mono<Long> countApprovedMentors();

    @Query("SELECT * FROM mentor_profiles ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorProfile> findAllWithPagination(int limit, int offset);

    @Query("SELECT COUNT(*) FROM mentor_profiles")
    Mono<Long> countAll();

    // ===================== Search by keyword =====================

    @Query("SELECT * FROM mentor_profiles WHERE status = 'APPROVED' AND (LOWER(current_job_title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(current_company) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(bio) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY rating_avg DESC LIMIT :limit OFFSET :offset")
    Flux<MentorProfile> searchMentors(String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM mentor_profiles WHERE status = 'APPROVED' AND (LOWER(current_job_title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(current_company) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(bio) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countSearchMentors(String keyword);

    // ===================== Combined filter =====================

    @Query("SELECT DISTINCT mp.* FROM mentor_profiles mp " +
            "LEFT JOIN mentor_expertise me ON mp.member_id = me.mentor_member_id " +
            "LEFT JOIN mentor_availabilities ma ON mp.member_id = ma.mentor_member_id " +
            "LEFT JOIN organization_members om ON mp.member_id = om.user_id " +
            "LEFT JOIN users gp ON gp.id = om.user_id " +
            "WHERE mp.status = 'APPROVED' " +
            "AND (:search IS NULL OR LOWER(mp.current_job_title) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(mp.current_company) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(mp.bio) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(gp.full_name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:category IS NULL OR LOWER(me.category) = LOWER(:category)) " +
            "AND (:expertise IS NULL OR LOWER(me.topic) LIKE LOWER(CONCAT('%', :expertise, '%'))) " +
            "AND (:minRating IS NULL OR mp.rating_avg >= :minRating) " +
            "AND (:hasAvailability = false OR (ma.status = 'AVAILABLE' AND ma.start_time > NOW())) " +
            "AND (:availableFrom IS NULL OR (ma.status = 'AVAILABLE' AND ma.end_time > :availableFrom)) " +
            "AND (:availableTo IS NULL OR (ma.status = 'AVAILABLE' AND ma.start_time < :availableTo)) " +
            "ORDER BY mp.rating_avg DESC LIMIT :limit OFFSET :offset")
    Flux<MentorProfile> filterMentors(String search, String category, String expertise, BigDecimal minRating,
                                      boolean hasAvailability,
                                      LocalDateTime availableFrom, LocalDateTime availableTo,
                                      int limit, int offset);

    @Query("SELECT COUNT(DISTINCT mp.member_id) FROM mentor_profiles mp " +
            "LEFT JOIN mentor_expertise me ON mp.member_id = me.mentor_member_id " +
            "LEFT JOIN mentor_availabilities ma ON mp.member_id = ma.mentor_member_id " +
            "LEFT JOIN organization_members om ON mp.member_id = om.user_id " +
            "LEFT JOIN users gp ON gp.id = om.user_id " +
            "WHERE mp.status = 'APPROVED' " +
            "AND (:search IS NULL OR LOWER(mp.current_job_title) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(mp.current_company) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(mp.bio) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(gp.full_name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:category IS NULL OR LOWER(me.category) = LOWER(:category)) " +
            "AND (:expertise IS NULL OR LOWER(me.topic) LIKE LOWER(CONCAT('%', :expertise, '%'))) " +
            "AND (:minRating IS NULL OR mp.rating_avg >= :minRating) " +
            "AND (:hasAvailability = false OR (ma.status = 'AVAILABLE' AND ma.start_time > NOW())) " +
            "AND (:availableFrom IS NULL OR (ma.status = 'AVAILABLE' AND ma.end_time > :availableFrom)) " +
            "AND (:availableTo IS NULL OR (ma.status = 'AVAILABLE' AND ma.start_time < :availableTo))")
    Mono<Long> countFilterMentors(String search, String category, String expertise, BigDecimal minRating,
                                  boolean hasAvailability,
                                  LocalDateTime availableFrom, LocalDateTime availableTo);

    @Query("SELECT DISTINCT mp.* FROM mentor_profiles mp " +
            "LEFT JOIN organization_members om ON mp.member_id = om.user_id " +
            "LEFT JOIN users gp ON gp.id = om.user_id " +
            "WHERE mp.status = 'APPROVED' " +
            "AND (LOWER(mp.current_job_title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR LOWER(mp.current_company) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR LOWER(mp.bio) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR LOWER(gp.full_name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY mp.rating_avg DESC LIMIT :limit OFFSET :offset")
    Flux<MentorProfile> searchMentorsWithName(String keyword, int limit, int offset);

    @Query("SELECT COUNT(DISTINCT mp.member_id) FROM mentor_profiles mp " +
            "LEFT JOIN organization_members om ON mp.member_id = om.user_id " +
            "LEFT JOIN users gp ON gp.id = om.user_id " +
            "WHERE mp.status = 'APPROVED' " +
            "AND (LOWER(mp.current_job_title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR LOWER(mp.current_company) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR LOWER(mp.bio) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR LOWER(gp.full_name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countSearchMentorsWithName(String keyword);

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
    @Query("UPDATE mentor_profiles SET status = 'APPROVED', updated_at = NOW() WHERE member_id = :memberId")
    Mono<Integer> approveMentor(Integer memberId);

    @Modifying
    @Query("UPDATE mentor_profiles SET status = 'REJECTED', updated_at = NOW() WHERE member_id = :memberId")
    Mono<Integer> revokeMentor(Integer memberId);

    @Modifying
    @Query("UPDATE mentor_profiles SET rating_avg = :ratingAvg, total_sessions = total_sessions + 1 WHERE member_id = :memberId")
    Mono<Integer> updateRatingAndIncrementSessions(Integer memberId, BigDecimal ratingAvg);

    @Modifying
    @Query("UPDATE mentor_profiles SET total_sessions = total_sessions + 1 WHERE member_id = :memberId")
    Mono<Integer> incrementTotalSessions(Integer memberId);
}
