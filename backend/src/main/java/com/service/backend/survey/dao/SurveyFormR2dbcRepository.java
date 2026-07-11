package com.service.backend.survey.dao;

import com.service.backend.shared.entity.SurveyForm;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

/**
 * The {@code questions_data} column is JSONB. Reads always project it with
 * {@code questions_data::text} so it maps to {@link SurveyForm#getQuestionsDataJson()};
 * writes cast the incoming String with {@code CAST(:questionsData AS jsonb)}.
 * A bare {@code SELECT *} must NOT be used for this table.
 */
@Repository
public interface SurveyFormR2dbcRepository extends R2dbcRepository<SurveyForm, Long> {

    String COLUMNS = "id, organization_id, creator_member_id, title, description, "
            + "questions_data::text AS questions_data, start_at, duration_minutes, status, "
            + "allow_multiple, created_at, updated_at";

    @Query("SELECT " + COLUMNS + " FROM survey_forms WHERE id = :id")
    Mono<SurveyForm> findByIdWithJson(@Param("id") Long id);

    // ---- Insert / Update (JSONB via CAST) ----

    @Query("""
            INSERT INTO survey_forms
                (organization_id, creator_member_id, title, description, questions_data,
                 start_at, duration_minutes, status, allow_multiple, created_at, updated_at)
            VALUES
                (:organizationId, :creatorMemberId, :title, :description, CAST(:questionsData AS jsonb),
                 :startAt, :durationMinutes, :status, :allowMultiple, now(), now())
            RETURNING id, organization_id, creator_member_id, title, description,
                      questions_data::text AS questions_data, start_at, duration_minutes, status,
                      allow_multiple, created_at, updated_at
            """)
    Mono<SurveyForm> insertForm(
            @Param("organizationId") Long organizationId,
            @Param("creatorMemberId") Long creatorMemberId,
            @Param("title") String title,
            @Param("description") String description,
            @Param("questionsData") String questionsData,
            @Param("startAt") LocalDateTime startAt,
            @Param("durationMinutes") Integer durationMinutes,
            @Param("status") String status,
            @Param("allowMultiple") Boolean allowMultiple);

    @Query("""
            UPDATE survey_forms
               SET title = :title,
                   description = :description,
                   questions_data = CAST(:questionsData AS jsonb),
                   start_at = :startAt,
                   duration_minutes = :durationMinutes,
                   allow_multiple = :allowMultiple,
                   updated_at = now()
             WHERE id = :id
            RETURNING id, organization_id, creator_member_id, title, description,
                      questions_data::text AS questions_data, start_at, duration_minutes, status,
                      allow_multiple, created_at, updated_at
            """)
    Mono<SurveyForm> updateForm(
            @Param("id") Long id,
            @Param("title") String title,
            @Param("description") String description,
            @Param("questionsData") String questionsData,
            @Param("startAt") LocalDateTime startAt,
            @Param("durationMinutes") Integer durationMinutes,
            @Param("allowMultiple") Boolean allowMultiple);

    @Modifying
    @Query("UPDATE survey_forms SET status = :status, start_at = :startAt, updated_at = now() WHERE id = :id")
    Mono<Integer> updateStatusAndStart(@Param("id") Long id,
                                       @Param("status") String status,
                                       @Param("startAt") LocalDateTime startAt);

    @Modifying
    @Query("UPDATE survey_forms SET status = :status, updated_at = now() WHERE id = :id")
    Mono<Integer> updateStatus(@Param("id") Long id, @Param("status") String status);

    // ---- Listing (admin) ----

    @Query("SELECT " + COLUMNS + " FROM survey_forms WHERE organization_id = :organizationId "
            + "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<SurveyForm> findByOrganization(@Param("organizationId") Long organizationId,
                                        @Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM survey_forms WHERE organization_id = :organizationId")
    Mono<Long> countByOrganization(@Param("organizationId") Long organizationId);

    @Query("SELECT " + COLUMNS + " FROM survey_forms ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<SurveyForm> findAllForms(@Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM survey_forms")
    Mono<Long> countAllForms();

    @Query("SELECT " + COLUMNS + " FROM survey_forms WHERE organization_id = :organizationId AND status = :status "
            + "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<SurveyForm> findByOrganizationAndStatus(@Param("organizationId") Long organizationId,
                                                 @Param("status") String status,
                                                 @Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM survey_forms WHERE organization_id = :organizationId AND status = :status")
    Mono<Long> countByOrganizationAndStatus(@Param("organizationId") Long organizationId,
                                            @Param("status") String status);

    @Query("SELECT " + COLUMNS + " FROM survey_forms WHERE status = :status "
            + "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<SurveyForm> findByStatus(@Param("status") String status,
                                  @Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM survey_forms WHERE status = :status")
    Mono<Long> countByStatus(@Param("status") String status);

    @Query("SELECT " + COLUMNS + " FROM survey_forms WHERE organization_id = :organizationId "
            + "AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) "
            + "  OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%'))) "
            + "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<SurveyForm> searchByOrganization(@Param("organizationId") Long organizationId,
                                          @Param("keyword") String keyword,
                                          @Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM survey_forms WHERE organization_id = :organizationId "
            + "AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) "
            + "  OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countSearchByOrganization(@Param("organizationId") Long organizationId,
                                         @Param("keyword") String keyword);

    @Query("SELECT " + COLUMNS + " FROM survey_forms "
            + "WHERE (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) "
            + "   OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%'))) "
            + "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<SurveyForm> searchAll(@Param("keyword") String keyword,
                               @Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM survey_forms "
            + "WHERE (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) "
            + "   OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countSearchAll(@Param("keyword") String keyword);

    // ---- User-facing: currently OPEN surveys within the time window ----

    @Query("SELECT " + COLUMNS + " FROM survey_forms "
            + "WHERE organization_id = :organizationId AND status = 'OPEN' "
            + "  AND start_at <= :now AND (start_at + make_interval(mins => duration_minutes)) > :now "
            + "ORDER BY start_at DESC")
    Flux<SurveyForm> findActiveByOrganization(@Param("organizationId") Long organizationId,
                                              @Param("now") LocalDateTime now);
}
