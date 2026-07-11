package com.service.backend.fundraising.dao;

import com.service.backend.shared.entity.Funds;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface FundR2dbcRepository extends R2dbcRepository<Funds, Long> {

    @Query("SELECT * FROM funds ORDER BY id DESC LIMIT :limit OFFSET :offset")
    Flux<Funds> findAllWithPagination(int limit, int offset);

    @Query("SELECT COUNT(*) FROM funds")
    Mono<Long> countAll();

    @Query("SELECT * FROM funds ORDER BY current_amount DESC LIMIT :limit")
    Flux<Funds> findTopByCurrentAmount(int limit);

    @Query("""
            SELECT * FROM funds
            WHERE (:organizationId IS NULL OR organization_id = :organizationId)
              AND (:keyword IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND ((:timeStartedFrom IS NULL AND :timeStartedTo IS NULL) OR time_started BETWEEN :timeStartedFrom AND :timeStartedTo)
              AND ((:targetAmountMin IS NULL AND :targetAmountMax IS NULL) OR target_amount BETWEEN :targetAmountMin AND :targetAmountMax)
            ORDER BY id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<Funds> findFiltered(
            Integer organizationId,
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
              AND (:keyword IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND ((:timeStartedFrom IS NULL AND :timeStartedTo IS NULL) OR time_started BETWEEN :timeStartedFrom AND :timeStartedTo)
              AND ((:targetAmountMin IS NULL AND :targetAmountMax IS NULL) OR target_amount BETWEEN :targetAmountMin AND :targetAmountMax)
            ORDER BY donor_count ASC
            LIMIT :limit OFFSET :offset
            """)
    Flux<Funds> findFilteredOrderByDonorCountAsc(
            Integer organizationId,
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
              AND (:keyword IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND ((:timeStartedFrom IS NULL AND :timeStartedTo IS NULL) OR time_started BETWEEN :timeStartedFrom AND :timeStartedTo)
              AND ((:targetAmountMin IS NULL AND :targetAmountMax IS NULL) OR target_amount BETWEEN :targetAmountMin AND :targetAmountMax)
            ORDER BY donor_count DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<Funds> findFilteredOrderByDonorCountDesc(
            Integer organizationId,
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
              AND (:keyword IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND ((:timeStartedFrom IS NULL AND :timeStartedTo IS NULL) OR time_started BETWEEN :timeStartedFrom AND :timeStartedTo)
              AND ((:targetAmountMin IS NULL AND :targetAmountMax IS NULL) OR target_amount BETWEEN :targetAmountMin AND :targetAmountMax)
            """)
    Mono<Long> countFiltered(
            Integer organizationId,
            String keyword,
            LocalDateTime timeStartedFrom,
            LocalDateTime timeStartedTo,
            BigDecimal targetAmountMin,
            BigDecimal targetAmountMax
    );

    @Query("""
        SELECT
            SUM(CASE WHEN time_started < :now AND time_ended > :now THEN 1 ELSE 0 END) AS total_funds,
            COALESCE(SUM(current_amount), 0) AS total_current_amount
        FROM funds
    """)
    Mono<com.service.backend.fundraising.dto.FundAggregatedStatsProjection> getAggregatedFundStats(@org.springframework.data.repository.query.Param("now") LocalDateTime now);

    @Query("""
        SELECT
            COUNT(*) AS total_funds,
            SUM(CASE WHEN time_started < :now AND time_ended > :now THEN 1 ELSE 0 END) AS active_funds,
            SUM(CASE WHEN time_ended IS NOT NULL AND time_ended <= CURRENT_TIMESTAMP THEN 1 ELSE 0 END) AS completed_funds,
            COALESCE(SUM(target_amount), 0) AS total_target_amount,
            COALESCE(SUM(current_amount), 0) AS total_current_amount
        FROM funds
    """)
    Mono<com.service.backend.admin.dto.AdminFundAggregatedStatsProjection> getAdminAggregatedFundStats(@org.springframework.data.repository.query.Param("now") LocalDateTime now);
}
