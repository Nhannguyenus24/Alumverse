package com.service.backend.survey.dao;

import com.service.backend.shared.entity.SurveySubmission;
import com.service.backend.survey.projection.SurveySubmissionProjection;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * {@code answers_data} is JSONB; reads project it with {@code answers_data::text} and
 * writes cast with {@code CAST(:answersData AS jsonb)}.
 */
@Repository
public interface SurveySubmissionR2dbcRepository extends ReactiveCrudRepository<SurveySubmission, Long> {

    String COLUMNS = "id, form_id, member_id, answers_data::text AS answers_data, submitted_at";

    @Query("""
            INSERT INTO survey_submissions (form_id, member_id, answers_data, submitted_at)
            VALUES (:formId, :memberId, CAST(:answersData AS jsonb), now())
            RETURNING id, form_id, member_id, answers_data::text AS answers_data, submitted_at
            """)
    Mono<SurveySubmission> insertSubmission(@Param("formId") Long formId,
                                            @Param("memberId") Long memberId,
                                            @Param("answersData") String answersData);

    @Query("SELECT s.id AS id, s.form_id AS form_id, s.member_id AS member_id, "
            + "s.answers_data::text AS answers_data, s.submitted_at AS submitted_at, "
            + "u.full_name AS member_name, u.email AS member_email "
            + "FROM survey_submissions s LEFT JOIN users u ON u.id = s.member_id "
            + "WHERE s.form_id = :formId ORDER BY s.submitted_at DESC LIMIT :limit OFFSET :offset")
    Flux<SurveySubmissionProjection> findByFormIdWithMember(@Param("formId") Long formId,
                                                            @Param("limit") int limit,
                                                            @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM survey_submissions WHERE form_id = :formId")
    Mono<Long> countByFormId(@Param("formId") Long formId);

    @Query("SELECT " + COLUMNS + " FROM survey_submissions WHERE form_id = :formId ORDER BY submitted_at ASC")
    Flux<SurveySubmission> findAllByFormId(@Param("formId") Long formId);

    @Query("SELECT COUNT(*) FROM survey_submissions WHERE form_id = :formId AND member_id = :memberId")
    Mono<Long> countByFormIdAndMemberId(@Param("formId") Long formId, @Param("memberId") Long memberId);

    @Query("SELECT " + COLUMNS + " FROM survey_submissions WHERE form_id = :formId AND member_id = :memberId "
            + "ORDER BY submitted_at DESC LIMIT 1")
    Mono<SurveySubmission> findLatestByFormIdAndMemberId(@Param("formId") Long formId,
                                                         @Param("memberId") Long memberId);
}
