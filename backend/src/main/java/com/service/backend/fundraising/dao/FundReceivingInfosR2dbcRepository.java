package com.service.backend.fundraising.dao;

import com.service.backend.fundraising.entity.FundReceivingInfos;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface FundReceivingInfosR2dbcRepository extends R2dbcRepository<FundReceivingInfos, Integer> {

    Mono<Boolean> existsByBankNameAndAccountNumber(String bankName, String accountNumber);
}
