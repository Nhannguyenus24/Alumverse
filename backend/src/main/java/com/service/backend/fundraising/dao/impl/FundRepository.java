package com.service.backend.fundraising.dao.impl;

import com.service.backend.fundraising.dao.repository.FundR2dbcRepository;
import com.service.backend.fundraising.entity.Funds;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;
import com.service.backend.fundraising.dao.interfaceclass.IFundRepository;

@Repository
@RequiredArgsConstructor
public class FundRepository implements IFundRepository {

    private final FundR2dbcRepository fundRepo;

    @Override
    public Mono<Funds> createFund(Funds fundData) {
        return fundRepo.save(fundData);
    }
}
