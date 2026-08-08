package com.service.backend.article.dao;

import com.service.backend.shared.entity.Job;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;

@Repository
public interface JobR2dbcRepository extends R2dbcRepository<Job, Integer> {

    String PUBLIC_FILTER = """
            organization_id = :organizationId
              AND is_active = true
              AND (:keyword = ''
                   OR POSITION(LOWER(:keyword) IN LOWER(COALESCE(title, ''))) > 0
                   OR POSITION(LOWER(:keyword) IN LOWER(COALESCE(description, ''))) > 0
                   OR POSITION(LOWER(:keyword) IN LOWER(COALESCE(company_name, ''))) > 0
                   OR POSITION(LOWER(:keyword) IN LOWER(COALESCE(location, ''))) > 0)
              AND (:topicsCsv = ''
                   OR CASE UPPER(COALESCE(type, ''))
                        WHEN 'FULL_TIME' THEN 'full_time'
                        WHEN 'PART_TIME' THEN 'part_time'
                        WHEN 'INTERNSHIP' THEN 'internship'
                        WHEN 'FREELANCE' THEN 'freelance'
                        WHEN 'CONTRACT' THEN 'remote'
                        ELSE LOWER(REPLACE(type, '-', '_'))
                      END = ANY(STRING_TO_ARRAY(:topicsCsv, ','))
                   OR ('internal_referral' = ANY(STRING_TO_ARRAY(:topicsCsv, ',')) AND is_referral = true))
              AND (:fromDate = '' OR CAST(COALESCE(updated_at, created_at) AS date) >= CAST(NULLIF(:fromDate, '') AS date))
              AND (:toDate = '' OR CAST(COALESCE(updated_at, created_at) AS date) <= CAST(NULLIF(:toDate, '') AS date))
            """;

    String PUBLIC_ORDER = """
            ORDER BY
              CASE WHEN :direction = 'oldest' THEN COALESCE(updated_at, created_at) END ASC,
              CASE WHEN :direction = 'newest' THEN COALESCE(updated_at, created_at) END DESC,
              CASE WHEN :direction = 'oldest' THEN id END ASC,
              CASE WHEN :direction = 'newest' THEN id END DESC
            """;

    @Query("SELECT * FROM jobs WHERE " + PUBLIC_FILTER + PUBLIC_ORDER + " LIMIT 1")
    Mono<Job> findPublicFeatured(Integer organizationId, String keyword, String topicsCsv,
                                 String fromDate, String toDate, String direction);

    @Query("SELECT * FROM jobs WHERE " + PUBLIC_FILTER
            + " AND (:featuredId IS NULL OR id <> :featuredId) " + PUBLIC_ORDER
            + " LIMIT :limit OFFSET :offset")
    Flux<Job> findPublicPage(Integer organizationId, Integer featuredId, String keyword,
                             String topicsCsv, String fromDate, String toDate,
                             String direction, int limit, int offset);

    @Query("SELECT COUNT(*) FROM jobs WHERE " + PUBLIC_FILTER
            + " AND (:featuredId IS NULL OR id <> :featuredId)")
    Mono<Long> countPublicPage(Integer organizationId, Integer featuredId, String keyword,
                               String topicsCsv, String fromDate, String toDate);

    @Query("SELECT * FROM jobs WHERE organization_id = :organizationId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Job> findByOrganizationIdWithPagination(Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM jobs WHERE organization_id = :organizationId")
    Mono<Long> countByOrganizationId(Integer organizationId);

    @Query("SELECT * FROM jobs ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Job> findAllWithPagination(int limit, int offset);

    @Query("SELECT * FROM jobs WHERE LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Job> searchAllByTitleWithPagination(String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM jobs WHERE LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Mono<Long> countAllSearchByTitle(String keyword);

    @Query("SELECT * FROM jobs WHERE organization_id = :organizationId AND is_active = true ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Job> findActiveByOrganizationId(Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM jobs WHERE organization_id = :organizationId AND is_active = true")
    Mono<Long> countActiveByOrganizationId(Integer organizationId);

    @Query("SELECT * FROM jobs WHERE organization_id = :organizationId AND is_active = true AND (deadline IS NULL OR deadline >= :today) ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Job> findOpenJobs(Integer organizationId, LocalDate today, int limit, int offset);

    @Query("SELECT COUNT(*) FROM jobs WHERE organization_id = :organizationId AND is_active = true AND (deadline IS NULL OR deadline >= :today)")
    Mono<Long> countOpenJobs(Integer organizationId, LocalDate today);

    @Query("SELECT * FROM jobs WHERE organization_id = :organizationId AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(company_name) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND is_active = true ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Job> searchJobs(Integer organizationId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM jobs WHERE organization_id = :organizationId AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(company_name) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND is_active = true")
    Mono<Long> countSearchJobs(Integer organizationId, String keyword);

    @Modifying
    @Query("UPDATE jobs SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> activateJob(Integer id);

    @Modifying
    @Query("UPDATE jobs SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> deactivateJob(Integer id);

    @Query("SELECT COUNT(*) FROM jobs WHERE is_active = true")
    Mono<Long> countAllActive();

    @Query("SELECT COUNT(*) FROM jobs WHERE created_at >= :since")
    Mono<Long> countSince(java.time.LocalDateTime since);

    @Query("SELECT * FROM jobs WHERE is_active = true AND (deadline IS NULL OR deadline >= :today) ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Job> findAllOpenJobsWithPagination(LocalDate today, int limit, int offset);

    @Query("SELECT COUNT(*) FROM jobs WHERE is_active = true AND (deadline IS NULL OR deadline >= :today)")
    Mono<Long> countAllOpenJobs(LocalDate today);
}
