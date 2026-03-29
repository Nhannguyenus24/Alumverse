package com.service.backend.fundraising.dao.interfaceclass;

import com.service.backend.fundraising.entity.Funds;
import reactor.core.publisher.Mono;

/**
 * Repository interface for fund management operations
 */
public interface IFundRepository {

    Mono<Funds> createFund(Funds fundData);
}
