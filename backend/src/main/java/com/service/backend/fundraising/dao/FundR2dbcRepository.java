package com.service.backend.fundraising.dao;

import com.service.backend.fundraising.entity.Funds;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface FundR2dbcRepository extends ReactiveCrudRepository<Funds, Long> {

    @Query("SELECT * FROM funds ORDER BY id DESC LIMIT :limit OFFSET :offset")
    Flux<Funds> findAllWithPagination(int limit, int offset);

    @Query("SELECT COUNT(*) FROM funds")
    Mono<Long> countAll();

    @Query("SELECT COUNT(*) FROM funds WHERE time_started < :now AND time_ended > :now")
    Mono<Long> countOpenFunds(LocalDateTime now);

    @Query("SELECT * FROM funds WHERE (LOWER(name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description_short) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description_full) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY id DESC LIMIT :limit OFFSET :offset")
    Flux<Funds> searchFunds(String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM funds WHERE (LOWER(name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description_short) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description_full) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countSearchFunds(String keyword);

    @Query("SELECT * FROM funds WHERE status_id = :statusId ORDER BY id DESC LIMIT :limit OFFSET :offset")
    Flux<Funds> findByStatusIdWithPagination(Integer statusId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM funds WHERE status_id = :statusId")
    Mono<Long> countByStatusId(Integer statusId);

    @Query("SELECT COALESCE(SUM(current_amount), 0) FROM funds")
    Mono<BigDecimal> sumCurrentAmount();

    @Query("""
            SELECT * FROM funds
            WHERE (:organizationId IS NULL OR organization_id = :organizationId)
              AND (:statusId IS NULL OR status_id = :statusId)
              AND (:keyword IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND ((:timeStartedFrom IS NULL AND :timeStartedTo IS NULL) OR time_started BETWEEN :timeStartedFrom AND :timeStartedTo)
              AND ((:targetAmountMin IS NULL AND :targetAmountMax IS NULL) OR target_amount BETWEEN :targetAmountMin AND :targetAmountMax)
            ORDER BY id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<Funds> findFiltered(
            Integer organizationId,
            Integer statusId,
            String keyword,
            LocalDateTime timeStartedFrom,
            LocalDateTime timeStartedTo,
            BigDecimal targetAmountMin,
            BigDecimal targetAmountMax,
            int limit,
            int offset
    );

    @Query("""
            SELECT * FROM funds
            WHERE (:organizationId IS NULL OR organization_id = :organizationId)
              AND (:statusId IS NULL OR status_id = :statusId)
              AND (:keyword IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND ((:timeStartedFrom IS NULL AND :timeStartedTo IS NULL) OR time_started BETWEEN :timeStartedFrom AND :timeStartedTo)
              AND ((:targetAmountMin IS NULL AND :targetAmountMax IS NULL) OR target_amount BETWEEN :targetAmountMin AND :targetAmountMax)
            ORDER BY donor_count ASC
            LIMIT :limit OFFSET :offset
            """)
    Flux<Funds> findFilteredOrderByDonorCountAsc(
            Integer organizationId,
            Integer statusId,
            String keyword,
            LocalDateTime timeStartedFrom,
            LocalDateTime timeStartedTo,
            BigDecimal targetAmountMin,
            BigDecimal targetAmountMax,
            int limit,
            int offset
    );

    @Query("""
            SELECT * FROM funds
            WHERE (:organizationId IS NULL OR organization_id = :organizationId)
              AND (:statusId IS NULL OR status_id = :statusId)
              AND (:keyword IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND ((:timeStartedFrom IS NULL AND :timeStartedTo IS NULL) OR time_started BETWEEN :timeStartedFrom AND :timeStartedTo)
              AND ((:targetAmountMin IS NULL AND :targetAmountMax IS NULL) OR target_amount BETWEEN :targetAmountMin AND :targetAmountMax)
            ORDER BY donor_count DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<Funds> findFilteredOrderByDonorCountDesc(
            Integer organizationId,
            Integer statusId,
            String keyword,
            LocalDateTime timeStartedFrom,
            LocalDateTime timeStartedTo,
            BigDecimal targetAmountMin,
            BigDecimal targetAmountMax,
            int limit,
            int offset
    );

    @Query("""
            SELECT COUNT(*) FROM funds
            WHERE (:organizationId IS NULL OR organization_id = :organizationId)
              AND (:statusId IS NULL OR status_id = :statusId)
              AND (:keyword IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND ((:timeStartedFrom IS NULL AND :timeStartedTo IS NULL) OR time_started BETWEEN :timeStartedFrom AND :timeStartedTo)
              AND ((:targetAmountMin IS NULL AND :targetAmountMax IS NULL) OR target_amount BETWEEN :targetAmountMin AND :targetAmountMax)
            """)
    Mono<Long> countFiltered(
            Integer organizationId,
            Integer statusId,
            String keyword,
            LocalDateTime timeStartedFrom,
            LocalDateTime timeStartedTo,
            BigDecimal targetAmountMin,
            BigDecimal targetAmountMax
    );
}
