package com.service.backend.mentorship.dao;

import com.service.backend.shared.entity.MentorshipReport;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface MentorshipReportR2dbcRepository extends ReactiveCrudRepository<MentorshipReport, Integer> {

    @Query("SELECT EXISTS(SELECT 1 FROM mentorship_reports WHERE session_id = :sessionId AND reporter_member_id = :reporterMemberId)")
    Mono<Boolean> existsBySessionIdAndReporterMemberId(Integer sessionId, Integer reporterMemberId);
}
