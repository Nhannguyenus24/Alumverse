package com.service.backend.article.dao;

import com.service.backend.shared.entity.Job;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;

@Repository
public interface JobR2dbcRepository extends ReactiveCrudRepository<Job, Integer> {

    @Query("SELECT * FROM jobs WHERE organization_id = :organizationId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Job> findByOrganizationIdWithPagination(Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM jobs WHERE organization_id = :organizationId")
    Mono<Long> countByOrganizationId(Integer organizationId);

    @Query("SELECT * FROM jobs ORDER BY published_at DESC LIMIT :limit OFFSET :offset")
    Flux<Job> findAllWithPagination(int limit, int offset);

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
    @Query("UPDATE jobs SET is_active = true WHERE id = :id")
    Mono<Integer> activateJob(Integer id);

    @Modifying
    @Query("UPDATE jobs SET is_active = false WHERE id = :id")
    Mono<Integer> deactivateJob(Integer id);

    @Query("SELECT COUNT(*) FROM jobs WHERE is_active = true")
    Mono<Long> countAllActive();

    @Query("SELECT COUNT(*) FROM jobs WHERE created_at >= :since")
    Mono<Long> countSince(java.time.LocalDateTime since);
}
