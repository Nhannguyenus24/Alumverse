package com.service.backend.mentorship.dao;

import com.service.backend.shared.entity.MentorshipSession;
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
            "LEFT JOIN organization_members om ON ms.mentee_member_id = om.user_id " +
            "LEFT JOIN users gp ON gp.id = om.user_id " +
            "WHERE ma.mentor_member_id = :mentorMemberId " +
            "AND (:date IS NULL OR CAST(ma.start_time AS DATE) = :date) " +
            "AND (:menteeName IS NULL OR LOWER(gp.full_name) LIKE LOWER(CONCAT('%', :menteeName, '%'))) " +
            "ORDER BY ms.created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorshipSession> filterSessionsByMentor(Integer mentorMemberId, LocalDate date, String menteeName, int limit, int offset);

    @Query("SELECT COUNT(ms.*) FROM mentorship_sessions ms " +
            "JOIN mentor_availabilities ma ON ms.availability_id = ma.id " +
            "LEFT JOIN organization_members om ON ms.mentee_member_id = om.user_id " +
            "LEFT JOIN users gp ON gp.id = om.user_id " +
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
            "LEFT JOIN organization_members om ON ma.mentor_member_id = om.user_id " +
            "LEFT JOIN users gp ON gp.id = om.user_id " +
            "WHERE ms.mentee_member_id = :menteeMemberId " +
            "AND (:date IS NULL OR CAST(ma.start_time AS DATE) = :date) " +
            "AND (:mentorName IS NULL OR LOWER(gp.full_name) LIKE LOWER(CONCAT('%', :mentorName, '%'))) " +
            "ORDER BY ms.created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorshipSession> filterSessionsByMentee(Integer menteeMemberId, LocalDate date, String mentorName, int limit, int offset);

    @Query("SELECT COUNT(ms.*) FROM mentorship_sessions ms " +
            "JOIN mentor_availabilities ma ON ms.availability_id = ma.id " +
            "LEFT JOIN organization_members om ON ma.mentor_member_id = om.user_id " +
            "LEFT JOIN users gp ON gp.id = om.user_id " +
            "WHERE ms.mentee_member_id = :menteeMemberId " +
            "AND (:date IS NULL OR CAST(ma.start_time AS DATE) = :date) " +
            "AND (:mentorName IS NULL OR LOWER(gp.full_name) LIKE LOWER(CONCAT('%', :mentorName, '%')))")
    Mono<Long> countFilterSessionsByMentee(Integer menteeMemberId, LocalDate date, String mentorName);

    // ===================== Status queries =====================

    // ===================== Modifying =====================

    @Modifying
    @Query("UPDATE mentorship_sessions SET status = :status WHERE id = :id")
    Mono<Integer> updateStatus(Integer id, String status);

    @Modifying
    @Query("UPDATE mentorship_sessions SET status = :status, cancel_reason = :cancelReason WHERE id = :id")
    Mono<Integer> updateStatusWithCancelReason(Integer id, String status, String cancelReason);

    @Modifying
    @Query("UPDATE mentorship_sessions SET meeting_link = :meetingLink WHERE id = :id")
    Mono<Integer> updateMeetingLink(Integer id, String meetingLink);

    @Modifying
    @Query("UPDATE mentorship_sessions SET status = :status, cancel_reason = :reason, " +
            "proposed_start_time = :proposedStart, proposed_end_time = :proposedEnd WHERE id = :id")
    Mono<Integer> proposeReschedule(Integer id, String status, String reason,
                                    java.time.LocalDateTime proposedStart, java.time.LocalDateTime proposedEnd);

    @Modifying
    @Query("UPDATE mentorship_sessions SET status = :status, " +
            "proposed_start_time = NULL, proposed_end_time = NULL WHERE id = :id")
    Mono<Integer> clearProposalWithStatus(Integer id, String status);

    @Modifying
    @Query("UPDATE mentorship_sessions SET status = :status, started_at = COALESCE(started_at, :now), " +
            "mentor_joined_at = CASE WHEN :isMentor THEN COALESCE(mentor_joined_at, :now) ELSE mentor_joined_at END, " +
            "mentee_joined_at = CASE WHEN :isMentor THEN mentee_joined_at ELSE COALESCE(mentee_joined_at, :now) END " +
            "WHERE id = :id")
    Mono<Integer> markJoined(Integer id, String status, boolean isMentor, java.time.LocalDateTime now);

    @Query("SELECT ms.* FROM mentorship_sessions ms " +
            "JOIN mentor_availabilities ma ON ms.availability_id = ma.id " +
            "WHERE ms.status IN ('CONFIRMED','IN_PROGRESS') AND ma.end_time < :now")
    Flux<MentorshipSession> findEndedCandidates(java.time.LocalDateTime now);

    @Modifying
    @Query("UPDATE mentorship_sessions SET status = :status, ended_at = :now WHERE id = :id")
    Mono<Integer> closeSession(Integer id, String status, java.time.LocalDateTime now);

    @Query("SELECT ma.start_time, ma.end_time, ma.mentor_member_id FROM mentor_availabilities ma " +
            "JOIN mentorship_sessions ms ON ms.availability_id = ma.id WHERE ms.id = :sessionId")
    Mono<SessionWindowProjection> findWindowBySessionId(Integer sessionId);

    // ===================== Meeting-link reminders =====================

    @Query("SELECT ms.id AS session_id, ma.mentor_member_id AS mentor_member_id, ma.start_time AS start_time " +
            "FROM mentorship_sessions ms " +
            "JOIN mentor_availabilities ma ON ms.availability_id = ma.id " +
            "LEFT JOIN mentor_profiles mp ON ma.mentor_member_id = mp.member_id " +
            "WHERE ms.status = 'CONFIRMED' " +
            "AND ms.meeting_link_reminded_at IS NULL " +
            "AND (ms.meeting_link IS NULL OR ms.meeting_link = '') " +
            "AND (mp.default_meeting_link IS NULL OR mp.default_meeting_link = '') " +
            "AND ma.start_time > :now AND ma.start_time <= :until")
    Flux<MeetingLinkReminderProjection> findMissingMeetingLinkCandidates(
            java.time.LocalDateTime now, java.time.LocalDateTime until);

    @Modifying
    @Query("UPDATE mentorship_sessions SET meeting_link_reminded_at = :now WHERE id = :id")
    Mono<Integer> markMeetingLinkReminded(Integer id, java.time.LocalDateTime now);

}
