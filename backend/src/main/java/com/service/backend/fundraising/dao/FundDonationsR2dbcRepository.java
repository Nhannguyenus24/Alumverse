package com.service.backend.fundraising.dao;

import com.service.backend.admin.dto.AdminFundDonationAggregatedStatsProjection;
import com.service.backend.shared.entity.FundDonations;
import com.service.backend.fundraising.projection.FundDonationListProjection;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface FundDonationsR2dbcRepository extends R2dbcRepository<FundDonations, Integer> {

    @Query("""
            UPDATE fund_donations
            SET status = 'SUCCESS',
                amount = :amount,
                sepay_transaction_id = :sepayTransactionId
            WHERE id = :donationId
              AND status = 'PENDING'
              AND sepay_transaction_id IS NULL
              AND NOT EXISTS (
                  SELECT 1
                  FROM fund_donations processed
                  WHERE processed.sepay_transaction_id = :sepayTransactionId
              )
            RETURNING *
            """)
    Mono<FundDonations> claimPendingDonation(
            @Param("donationId") Integer donationId,
            @Param("sepayTransactionId") Long sepayTransactionId,
            @Param("amount") BigDecimal amount);

    @Query("""
            INSERT INTO fund_donations (
                fund_id,
                donor_member_id,
                donor_name,
                amount,
                address,
                phone,
                email,
                message,
                status,
                created_at,
                sepay_transaction_id
            )
            SELECT
                fund_id,
                donor_member_id,
                donor_name,
                :amount,
                address,
                phone,
                email,
                message,
                'SUCCESS',
                CURRENT_TIMESTAMP,
                :sepayTransactionId
            FROM fund_donations
            WHERE id = :sourceDonationId
            ON CONFLICT (sepay_transaction_id) DO NOTHING
            RETURNING *
            """)
    Mono<FundDonations> insertAdditionalDonation(
            @Param("sourceDonationId") Integer sourceDonationId,
            @Param("sepayTransactionId") Long sepayTransactionId,
            @Param("amount") BigDecimal amount);

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              f.name AS fund_name,
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
            LEFT JOIN funds f ON f.id = fd.fund_id
            LEFT JOIN users u ON fd.donor_member_id IS NOT NULL AND u.id = fd.donor_member_id
            WHERE fd.fund_id = :fundId
              AND fd.status = 'SUCCESS'
            ORDER BY fd.id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundDonationListProjection> findByFundIdWithPagination(Long fundId, int limit, int offset);

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              f.name AS fund_name,
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
            LEFT JOIN funds f ON f.id = fd.fund_id
            LEFT JOIN users u ON fd.donor_member_id IS NOT NULL AND u.id = fd.donor_member_id
            WHERE fd.fund_id = :fundId
              AND fd.status = 'SUCCESS'
            ORDER BY fd.id DESC
            """)
    Flux<FundDonationListProjection> findAllByFundId(Long fundId);

    @Query("""
            SELECT COUNT(*) FROM fund_donations
            WHERE fund_id = :fundId
              AND status = 'SUCCESS'
            """)
    Mono<Long> countByFundId(Long fundId);

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              f.name AS fund_name,
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
            LEFT JOIN funds f ON f.id = fd.fund_id
            LEFT JOIN users u ON u.id = fd.donor_member_id
            WHERE fd.donor_member_id = :donorMemberId
              AND fd.status = 'SUCCESS'
            ORDER BY fd.id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundDonationListProjection> findByDonorMemberIdWithPagination(Integer donorMemberId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM fund_donations WHERE donor_member_id = :donorMemberId AND status = 'SUCCESS'")
    Mono<Long> countByDonorMemberId(Integer donorMemberId);

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              f.name AS fund_name,
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
            LEFT JOIN funds f ON f.id = fd.fund_id
            LEFT JOIN users u ON u.id = fd.donor_member_id
            WHERE fd.donor_member_id = :donorMemberId
              AND fd.status = 'SUCCESS'
              AND fd.donor_name <> :anonymousPlaceholder
            ORDER BY fd.id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundDonationListProjection> findByDonorMemberIdVisibleToOthersWithPagination(
            Integer donorMemberId, String anonymousPlaceholder, int limit, int offset);

    @Query("""
            SELECT COUNT(*) FROM fund_donations
            WHERE donor_member_id = :donorMemberId
              AND status = 'SUCCESS'
              AND donor_name <> :anonymousPlaceholder
            """)
    Mono<Long> countByDonorMemberIdVisibleToOthers(Integer donorMemberId, String anonymousPlaceholder);

    @Query("SELECT COUNT(*) FROM fund_donations WHERE status = 'SUCCESS'")
    Mono<Long> countAll();

    @Query("SELECT COALESCE(SUM(amount), 0) FROM fund_donations WHERE status = 'SUCCESS' AND created_at >= :start AND created_at < :end")
    Mono<BigDecimal> sumAmountBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT CAST(created_at AS DATE) AS date, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount " +
           "FROM fund_donations " +
           "WHERE status = 'SUCCESS' AND created_at >= CURRENT_DATE - INTERVAL '30 days' " +
           "GROUP BY CAST(created_at AS DATE) " +
           "ORDER BY date")
    Flux<com.service.backend.shared.projection.DailyAmountProjection> getDailyDonationCounts();

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              f.name AS fund_name,
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
            LEFT JOIN funds f ON f.id = fd.fund_id
            LEFT JOIN users u ON u.id = fd.donor_member_id
            WHERE fd.fund_id = :fundId
              AND fd.donor_name ILIKE CONCAT('%', :keyword, '%')
              AND fd.status = 'SUCCESS'
            ORDER BY fd.id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundDonationListProjection> searchByDonorName(Long fundId, String keyword, int limit, int offset);

    @Query("""
            SELECT COUNT(*) FROM fund_donations
            WHERE fund_id = :fundId AND donor_name ILIKE CONCAT('%', :keyword, '%')
              AND status = 'SUCCESS'
            """)
    Mono<Long> countSearchByDonorName(Long fundId, String keyword);

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              f.name AS fund_name,
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
            LEFT JOIN funds f ON f.id = fd.fund_id
            LEFT JOIN users u ON u.id = fd.donor_member_id
            WHERE fd.fund_id = :fundId
              AND fd.phone ILIKE CONCAT('%', :keyword, '%')
              AND fd.status = 'SUCCESS'
            ORDER BY fd.id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundDonationListProjection> searchByPhone(Long fundId, String keyword, int limit, int offset);

    @Query("""
            SELECT COUNT(*) FROM fund_donations
            WHERE fund_id = :fundId AND phone ILIKE CONCAT('%', :keyword, '%')
              AND status = 'SUCCESS'
            """)
    Mono<Long> countSearchByPhone(Long fundId, String keyword);

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              f.name AS fund_name,
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
            LEFT JOIN funds f ON f.id = fd.fund_id
            LEFT JOIN users u ON u.id = fd.donor_member_id
            WHERE fd.fund_id = :fundId
              AND fd.address ILIKE CONCAT('%', :keyword, '%')
              AND fd.status = 'SUCCESS'
            ORDER BY fd.id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundDonationListProjection> searchByAddress(Long fundId, String keyword, int limit, int offset);

    @Query("""
            SELECT COUNT(*) FROM fund_donations
            WHERE fund_id = :fundId AND address ILIKE CONCAT('%', :keyword, '%')
              AND status = 'SUCCESS'
            """)
    Mono<Long> countSearchByAddress(Long fundId, String keyword);

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              f.name AS fund_name,
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
            LEFT JOIN funds f ON f.id = fd.fund_id
            LEFT JOIN users u ON u.id = fd.donor_member_id
            WHERE fd.fund_id = :fundId
              AND fd.message ILIKE CONCAT('%', :keyword, '%')
              AND fd.status = 'SUCCESS'
            ORDER BY fd.id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundDonationListProjection> searchByMessage(Long fundId, String keyword, int limit, int offset);

    @Query("""
            SELECT COUNT(*) FROM fund_donations
            WHERE fund_id = :fundId AND message ILIKE CONCAT('%', :keyword, '%')
              AND status = 'SUCCESS'
            """)
    Mono<Long> countSearchByMessage(Long fundId, String keyword);

    @Query("""
            SELECT
              fd.id AS id,
              fd.fund_id AS fund_id,
              f.name AS fund_name,
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
            LEFT JOIN funds f ON f.id = fd.fund_id
            LEFT JOIN users u ON u.id = fd.donor_member_id
            WHERE fd.fund_id = :fundId
              AND fd.email ILIKE CONCAT('%', :keyword, '%')
              AND fd.status = 'SUCCESS'
            ORDER BY fd.id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundDonationListProjection> searchByEmail(Long fundId, String keyword, int limit, int offset);

    @Query("""
            SELECT COUNT(*) FROM fund_donations
            WHERE fund_id = :fundId AND email ILIKE CONCAT('%', :keyword, '%')
              AND status = 'SUCCESS'
            """)
    Mono<Long> countSearchByEmail(Long fundId, String keyword);

    @Query("""
        SELECT
            SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) AS total_donations,
            COALESCE(SUM(CASE WHEN status = 'SUCCESS' AND created_at >= :start AND created_at < :end THEN amount ELSE 0 END), 0) AS total_donations_amount_this_month
        FROM fund_donations
    """)
    Mono<com.service.backend.fundraising.dto.FundDonationAggregatedStatsProjection> getAggregatedDonationStats(
            @org.springframework.data.repository.query.Param("start") LocalDateTime start,
            @org.springframework.data.repository.query.Param("end") LocalDateTime end
    );

    @Query("""
        SELECT
            COUNT(*) AS total_donations,
            SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) AS successful_donations,
            SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_donations,
            SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed_donations,
            COALESCE(SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END), 0) AS successful_amount
        FROM fund_donations
    """)
    Mono<AdminFundDonationAggregatedStatsProjection> getAdminAggregatedDonationStats();
}
