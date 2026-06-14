package com.service.backend.fundraising.dao;

import com.service.backend.shared.entity.FundReceivingInfos;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface FundReceivingInfosR2dbcRepository extends R2dbcRepository<FundReceivingInfos, Integer> {

    Mono<Boolean> existsByBankNameAndAccountNumber(String bankName, String accountNumber);

    @Query("""
            SELECT id, account_number, account_name, bank_name, is_active
            FROM fund_receiving_infos
            WHERE is_active = true
            ORDER BY id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundReceivingInfos> findActivePage(int limit, int offset);

    @Query("SELECT COUNT(*) FROM fund_receiving_infos WHERE is_active = true")
    Mono<Long> countActive();

    @Query("""
            SELECT id, account_number, account_name, bank_name, is_active
            FROM fund_receiving_infos
            WHERE is_active = true
              AND (
                LOWER(account_number) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(account_name)  LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(bank_name)     LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            ORDER BY id DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<FundReceivingInfos> findActivePageByKeyword(String keyword, int limit, int offset);

    @Query("""
            SELECT COUNT(*) FROM fund_receiving_infos
            WHERE is_active = true
              AND (
                LOWER(account_number) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(account_name)  LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(bank_name)     LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            """)
    Mono<Long> countActiveByKeyword(String keyword);
}
