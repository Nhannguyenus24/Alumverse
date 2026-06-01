package com.service.backend.mentorship.dao;

import com.service.backend.mentorship.entity.MentorshipSession;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;

@Repository
public interface MentorshipSessionR2dbcRepository extends ReactiveCrudRepository<MentorshipSession, Integer> {

    // ===================== Mentor view: basic =====================

    @Query("SELECT ms.* FROM mentorship_sessions ms JOIN mentor_availabilities ma ON ms.availability_id = ma.id WHERE ma.mentor_member_id = :mentorMemberId ORDER BY ms.created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorshipSession> findByMentorMemberId(Integer mentorMemberId, int limit, int offset);

    @Query("SELECT COUNT(ms.*) FROM mentorship_sessions ms JOIN mentor_availabilities ma ON ms.availability_id = ma.id WHERE ma.mentor_member_id = :mentorMemberId")
    Mono<Long> countByMentorMemberId(Integer mentorMemberId);

    // ===================== Mentor view: filter by date + mentee name =====================

    @Query("SELECT ms.* FROM mentorship_sessions ms " +
            "JOIN mentor_availabilities ma ON ms.availability_id = ma.id " +
            "LEFT JOIN organization_members om ON ms.mentee_member_id = om.id " +
            "LEFT JOIN global_profiles gp ON om.user_id = gp.user_id " +
            "WHERE ma.mentor_member_id = :mentorMemberId " +
            "AND (:date IS NULL OR CAST(ma.start_time AS DATE) = :date) " +
            "AND (:menteeName IS NULL OR LOWER(gp.full_name) LIKE LOWER(CONCAT('%', :menteeName, '%'))) " +
            "ORDER BY ms.created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorshipSession> filterSessionsByMentor(Integer mentorMemberId, LocalDate date, String menteeName, int limit, int offset);

    @Query("SELECT COUNT(ms.*) FROM mentorship_sessions ms " +
            "JOIN mentor_availabilities ma ON ms.availability_id = ma.id " +
            "LEFT JOIN organization_members om ON ms.mentee_member_id = om.id " +
            "LEFT JOIN global_profiles gp ON om.user_id = gp.user_id " +
            "WHERE ma.mentor_member_id = :mentorMemberId " +
            "AND (:date IS NULL OR CAST(ma.start_time AS DATE) = :date) " +
            "AND (:menteeName IS NULL OR LOWER(gp.full_name) LIKE LOWER(CONCAT('%', :menteeName, '%')))")
    Mono<Long> countFilterSessionsByMentor(Integer mentorMemberId, LocalDate date, String menteeName);

    // ===================== Mentee view: basic =====================

    @Query("SELECT * FROM mentorship_sessions WHERE mentee_member_id = :menteeMemberId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorshipSession> findByMenteeMemberId(Integer menteeMemberId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM mentorship_sessions WHERE mentee_member_id = :menteeMemberId")
    Mono<Long> countByMenteeMemberId(Integer menteeMemberId);

    // ===================== Mentee view: filter by date + mentor name =====================

    @Query("SELECT ms.* FROM mentorship_sessions ms " +
            "JOIN mentor_availabilities ma ON ms.availability_id = ma.id " +
            "LEFT JOIN organization_members om ON ma.mentor_member_id = om.id " +
            "LEFT JOIN global_profiles gp ON om.user_id = gp.user_id " +
            "WHERE ms.mentee_member_id = :menteeMemberId " +
            "AND (:date IS NULL OR CAST(ma.start_time AS DATE) = :date) " +
            "AND (:mentorName IS NULL OR LOWER(gp.full_name) LIKE LOWER(CONCAT('%', :mentorName, '%'))) " +
            "ORDER BY ms.created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorshipSession> filterSessionsByMentee(Integer menteeMemberId, LocalDate date, String mentorName, int limit, int offset);

    @Query("SELECT COUNT(ms.*) FROM mentorship_sessions ms " +
            "JOIN mentor_availabilities ma ON ms.availability_id = ma.id " +
            "LEFT JOIN organization_members om ON ma.mentor_member_id = om.id " +
            "LEFT JOIN global_profiles gp ON om.user_id = gp.user_id " +
            "WHERE ms.mentee_member_id = :menteeMemberId " +
            "AND (:date IS NULL OR CAST(ma.start_time AS DATE) = :date) " +
            "AND (:mentorName IS NULL OR LOWER(gp.full_name) LIKE LOWER(CONCAT('%', :mentorName, '%')))")
    Mono<Long> countFilterSessionsByMentee(Integer menteeMemberId, LocalDate date, String mentorName);

    // ===================== Status queries =====================

    @Query("SELECT ms.* FROM mentorship_sessions ms JOIN mentor_availabilities ma ON ms.availability_id = ma.id WHERE ma.mentor_member_id = :mentorMemberId AND ms.status = :status ORDER BY ms.created_at DESC")
    Flux<MentorshipSession> findByMentorMemberIdAndStatus(Integer mentorMemberId, String status);

    @Query("SELECT * FROM mentorship_sessions WHERE mentee_member_id = :menteeMemberId AND status = :status ORDER BY created_at DESC")
    Flux<MentorshipSession> findByMenteeMemberIdAndStatus(Integer menteeMemberId, String status);

    // ===================== Modifying =====================

    @Modifying
    @Query("UPDATE mentorship_sessions SET status = :status WHERE id = :id")
    Mono<Integer> updateStatus(Integer id, String status);

    @Modifying
    @Query("UPDATE mentorship_sessions SET meeting_link = :meetingLink WHERE id = :id")
    Mono<Integer> updateMeetingLink(Integer id, String meetingLink);

    @Query("SELECT * FROM mentorship_sessions WHERE availability_id = :availabilityId AND status != 'Rejected' AND status != 'Cancelled'")
    Flux<MentorshipSession> findActiveByAvailabilityId(Integer availabilityId);

}
