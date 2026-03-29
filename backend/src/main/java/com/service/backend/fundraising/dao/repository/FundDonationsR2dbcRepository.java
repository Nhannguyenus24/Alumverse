package com.service.backend.fundraising.dao.repository;

import com.service.backend.fundraising.entity.FundDonations;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface FundDonationsR2dbcRepository extends ReactiveCrudRepository<FundDonations, Long> {

    @Query("SELECT * FROM fund_donations WHERE fund_id = :fundId ORDER BY id DESC LIMIT :limit OFFSET :offset")
    Flux<FundDonations> findByFundIdWithPagination(Long fundId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM fund_donations WHERE fund_id = :fundId")
    Mono<Long> countByFundId(Long fundId);
    
    @Query("SELECT COUNT(*) FROM fund_donations")
    Mono<Long> countAll();

    @Query("SELECT COALESCE(SUM(amount), 0) FROM fund_donations WHERE created_at >= :start AND created_at < :end")
    Mono<java.math.BigDecimal> sumAmountBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    // Search by specific text columns (ILIKE)
    @Query("SELECT * FROM fund_donations WHERE fund_id = :fundId AND donor_name ILIKE CONCAT('%', :keyword, '%') ORDER BY id DESC LIMIT :limit OFFSET :offset")
    Flux<FundDonations> searchByDonorName(Long fundId, String keyword, int limit, int offset);
    @Query("SELECT COUNT(*) FROM fund_donations WHERE fund_id = :fundId AND donor_name ILIKE CONCAT('%', :keyword, '%')")
    Mono<Long> countSearchByDonorName(Long fundId, String keyword);

    @Query("SELECT * FROM fund_donations WHERE fund_id = :fundId AND phone ILIKE CONCAT('%', :keyword, '%') ORDER BY id DESC LIMIT :limit OFFSET :offset")
    Flux<FundDonations> searchByPhone(Long fundId, String keyword, int limit, int offset);
    @Query("SELECT COUNT(*) FROM fund_donations WHERE fund_id = :fundId AND phone ILIKE CONCAT('%', :keyword, '%')")
    Mono<Long> countSearchByPhone(Long fundId, String keyword);

    @Query("SELECT * FROM fund_donations WHERE fund_id = :fundId AND address ILIKE CONCAT('%', :keyword, '%') ORDER BY id DESC LIMIT :limit OFFSET :offset")
    Flux<FundDonations> searchByAddress(Long fundId, String keyword, int limit, int offset);
    @Query("SELECT COUNT(*) FROM fund_donations WHERE fund_id = :fundId AND address ILIKE CONCAT('%', :keyword, '%')")
    Mono<Long> countSearchByAddress(Long fundId, String keyword);

    @Query("SELECT * FROM fund_donations WHERE fund_id = :fundId AND message ILIKE CONCAT('%', :keyword, '%') ORDER BY id DESC LIMIT :limit OFFSET :offset")
    Flux<FundDonations> searchByMessage(Long fundId, String keyword, int limit, int offset);
    @Query("SELECT COUNT(*) FROM fund_donations WHERE fund_id = :fundId AND message ILIKE CONCAT('%', :keyword, '%')")
    Mono<Long> countSearchByMessage(Long fundId, String keyword);

    @Query("SELECT * FROM fund_donations WHERE fund_id = :fundId AND email ILIKE CONCAT('%', :keyword, '%') ORDER BY id DESC LIMIT :limit OFFSET :offset")
    Flux<FundDonations> searchByEmail(Long fundId, String keyword, int limit, int offset);
    @Query("SELECT COUNT(*) FROM fund_donations WHERE fund_id = :fundId AND email ILIKE CONCAT('%', :keyword, '%')")
    Mono<Long> countSearchByEmail(Long fundId, String keyword);

    // Search by amount equals
    @Query("SELECT * FROM fund_donations WHERE fund_id = :fundId AND amount = :amount ORDER BY id DESC LIMIT :limit OFFSET :offset")
    Flux<FundDonations> searchByAmount(Long fundId, java.math.BigDecimal amount, int limit, int offset);
    @Query("SELECT COUNT(*) FROM fund_donations WHERE fund_id = :fundId AND amount = :amount")
    Mono<Long> countSearchByAmount(Long fundId, java.math.BigDecimal amount);
}
