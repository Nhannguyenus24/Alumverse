package com.service.backend.fundraising.dao;

import com.service.backend.shared.entity.FundDonations;
import com.service.backend.fundraising.projection.FundDonationListProjection;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface FundDonationsR2dbcRepository extends ReactiveCrudRepository<FundDonations, Integer> {

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              fd.donor_member_id AS donor_member_id,
              fd.donor_name AS donor_name,
              fd.amount AS amount,
              fd.address AS address,
              fd.phone AS phone,
              fd.email AS email,
              fd.message AS message,
              fd.status AS status,
              fd.created_at AS created_at,
              u.avatar_url AS avatar_url
            FROM fund_donations fd
            LEFT JOIN users u ON u.id = fd.donor_member_id
            WHERE fd.fund_id = :fundId
            ORDER BY fd.id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundDonationListProjection> findByFundIdWithPagination(Long fundId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM fund_donations WHERE fund_id = :fundId")
    Mono<Long> countByFundId(Long fundId);

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              fd.donor_member_id AS donor_member_id,
              fd.donor_name AS donor_name,
              fd.amount AS amount,
              fd.address AS address,
              fd.phone AS phone,
              fd.email AS email,
              fd.message AS message,
              fd.status AS status,
              fd.created_at AS created_at,
              u.avatar_url AS avatar_url
            FROM fund_donations fd
            LEFT JOIN users u ON u.id = fd.donor_member_id
            WHERE fd.donor_member_id = :donorMemberId
            ORDER BY fd.id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundDonationListProjection> findByDonorMemberIdWithPagination(Integer donorMemberId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM fund_donations WHERE donor_member_id = :donorMemberId")
    Mono<Long> countByDonorMemberId(Integer donorMemberId);

    @Query("SELECT COUNT(*) FROM fund_donations WHERE status = 'SUCCESS'")
    Mono<Long> countAll();

    @Query("SELECT COALESCE(SUM(amount), 0) FROM fund_donations WHERE status = 'SUCCESS' AND created_at >= :start AND created_at < :end")
    Mono<BigDecimal> sumAmountBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(*) FROM fund_donations")
    Mono<Long> countAllDonations();

    @Query("SELECT COUNT(*) FROM fund_donations WHERE status = :status")
    Mono<Long> countByStatus(String status);

    @Query("SELECT COALESCE(SUM(amount), 0) FROM fund_donations WHERE status = 'SUCCESS'")
    Mono<BigDecimal> sumSuccessfulAmount();

    @Query("SELECT CAST(created_at AS DATE) AS date, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount " +
           "FROM fund_donations " +
           "WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' " +
           "GROUP BY CAST(created_at AS DATE) " +
           "ORDER BY date")
    Flux<com.service.backend.shared.projection.DailyAmountProjection> getDailyDonationCounts();

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              fd.donor_member_id AS donor_member_id,
              fd.donor_name AS donor_name,
              fd.amount AS amount,
              fd.address AS address,
              fd.phone AS phone,
              fd.email AS email,
              fd.message AS message,
              fd.status AS status,
              fd.created_at AS created_at,
              u.avatar_url AS avatar_url
            FROM fund_donations fd
            LEFT JOIN users u ON u.id = fd.donor_member_id
            WHERE fd.fund_id = :fundId
              AND fd.donor_name ILIKE CONCAT('%', :keyword, '%')
            ORDER BY fd.id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundDonationListProjection> searchByDonorName(Long fundId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM fund_donations WHERE fund_id = :fundId AND donor_name ILIKE CONCAT('%', :keyword, '%')")
    Mono<Long> countSearchByDonorName(Long fundId, String keyword);

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              fd.donor_member_id AS donor_member_id,
              fd.donor_name AS donor_name,
              fd.amount AS amount,
              fd.address AS address,
              fd.phone AS phone,
              fd.email AS email,
              fd.message AS message,
              fd.status AS status,
              fd.created_at AS created_at,
              u.avatar_url AS avatar_url
            FROM fund_donations fd
            LEFT JOIN users u ON u.id = fd.donor_member_id
            WHERE fd.fund_id = :fundId
              AND fd.phone ILIKE CONCAT('%', :keyword, '%')
            ORDER BY fd.id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundDonationListProjection> searchByPhone(Long fundId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM fund_donations WHERE fund_id = :fundId AND phone ILIKE CONCAT('%', :keyword, '%')")
    Mono<Long> countSearchByPhone(Long fundId, String keyword);

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              fd.donor_member_id AS donor_member_id,
              fd.donor_name AS donor_name,
              fd.amount AS amount,
              fd.address AS address,
              fd.phone AS phone,
              fd.email AS email,
              fd.message AS message,
              fd.status AS status,
              fd.created_at AS created_at,
              u.avatar_url AS avatar_url
            FROM fund_donations fd
            LEFT JOIN users u ON u.id = fd.donor_member_id
            WHERE fd.fund_id = :fundId
              AND fd.address ILIKE CONCAT('%', :keyword, '%')
            ORDER BY fd.id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundDonationListProjection> searchByAddress(Long fundId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM fund_donations WHERE fund_id = :fundId AND address ILIKE CONCAT('%', :keyword, '%')")
    Mono<Long> countSearchByAddress(Long fundId, String keyword);

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              fd.donor_member_id AS donor_member_id,
              fd.donor_name AS donor_name,
              fd.amount AS amount,
              fd.address AS address,
              fd.phone AS phone,
              fd.email AS email,
              fd.message AS message,
              fd.status AS status,
              fd.created_at AS created_at,
              u.avatar_url AS avatar_url
            FROM fund_donations fd
            LEFT JOIN users u ON u.id = fd.donor_member_id
            WHERE fd.fund_id = :fundId
              AND fd.message ILIKE CONCAT('%', :keyword, '%')
            ORDER BY fd.id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundDonationListProjection> searchByMessage(Long fundId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM fund_donations WHERE fund_id = :fundId AND message ILIKE CONCAT('%', :keyword, '%')")
    Mono<Long> countSearchByMessage(Long fundId, String keyword);

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              fd.donor_member_id AS donor_member_id,
              fd.donor_name AS donor_name,
              fd.amount AS amount,
              fd.address AS address,
              fd.phone AS phone,
              fd.email AS email,
              fd.message AS message,
              fd.status AS status,
              fd.created_at AS created_at,
              u.avatar_url AS avatar_url
            FROM fund_donations fd
            LEFT JOIN users u ON u.id = fd.donor_member_id
            WHERE fd.fund_id = :fundId
              AND fd.email ILIKE CONCAT('%', :keyword, '%')
            ORDER BY fd.id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundDonationListProjection> searchByEmail(Long fundId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM fund_donations WHERE fund_id = :fundId AND email ILIKE CONCAT('%', :keyword, '%')")
    Mono<Long> countSearchByEmail(Long fundId, String keyword);
}
