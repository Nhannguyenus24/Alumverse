package com.service.backend.mentorship.dao;

import com.service.backend.shared.entity.MentorshipReport;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface MentorshipReportR2dbcRepository extends R2dbcRepository<MentorshipReport, Integer> {

    @Query("SELECT EXISTS(SELECT 1 FROM mentorship_reports WHERE session_id = :sessionId AND reporter_member_id = :reporterMemberId)")
    Mono<Boolean> existsBySessionIdAndReporterMemberId(Integer sessionId, Integer reporterMemberId);

    // ===================== Admin: list + resolve =====================

    @Query("SELECT * FROM mentorship_reports ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorshipReport> findAllReports(int limit, int offset);

    @Query("SELECT COUNT(*) FROM mentorship_reports")
    Mono<Long> countAllReports();

    @Query("SELECT * FROM mentorship_reports WHERE status = :status ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<MentorshipReport> findReportsByStatus(String status, int limit, int offset);

    @Query("SELECT COUNT(*) FROM mentorship_reports WHERE status = :status")
    Mono<Long> countReportsByStatus(String status);

    @Modifying
    @Query("UPDATE mentorship_reports SET status = :status, action_taken = :actionTaken, " +
            "resolution_note = :resolutionNote, resolved_by = :resolvedBy, resolved_at = NOW() " +
            "WHERE id = :reportId")
    Mono<Integer> resolveReport(Integer reportId, String status, String actionTaken,
                                String resolutionNote, Integer resolvedBy);
}
