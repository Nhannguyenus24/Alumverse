package com.service.backend.organization.dao;

import com.service.backend.organization.entity.Organization;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface OrganizationRepository extends R2dbcRepository<Organization, Long> {

    Mono<Organization> findBySlug(String slug);

    Flux<Organization> findAll();
}
