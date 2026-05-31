package com.service.backend.fundraising.dao;

import com.service.backend.shared.entity.FundStatus;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FundStatusR2dbcRepository extends ReactiveCrudRepository<FundStatus, Integer> {
}
