package com.service.backend.organization.dao;

import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.organization.entity.OrganizationIntroduction;

import reactor.core.publisher.Mono;

@Repository
public interface OrganizationIntroductionRepository extends R2dbcRepository<OrganizationIntroduction, Integer> {

    Mono<OrganizationIntroduction> findByOrgaId(Integer orgaId);
}
