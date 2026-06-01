package com.service.backend.organization.dao;

import com.service.backend.organization.dto.TrustedVerifierResponse;
import com.service.backend.organization.entity.Organization;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface OrganizationRepository extends R2dbcRepository<Organization, Integer> {

    Mono<Organization> findBySlug(String slug);

    Flux<Organization> findAll();

    @Query("SELECT u.id AS user_id, gp.full_name, u.user_name, u.avatar_url, u.email, om.major, om.program " +
           "FROM users u " +
           "JOIN organization_members om ON u.id = om.user_id " +
           "LEFT JOIN global_profiles gp ON u.id = gp.user_id " +
           "WHERE om.organization_id = :organizationId " +
           "AND om.is_trusted_verifier = true " +
           "AND om.status = 'active'")
    Flux<TrustedVerifierResponse> findTrustedVerifiersByOrganizationId(Integer organizationId);
}
