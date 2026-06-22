package com.service.backend.user.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.EducationChangeRequest;
import com.service.backend.shared.enums.Status;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface EducationChangeRequestRepository extends R2dbcRepository<EducationChangeRequest, Integer> {

    Mono<EducationChangeRequest> findByMemberIdAndStatus(Integer memberId, Status status);

    @Query("SELECT * FROM education_change_requests WHERE organization_id = :organizationId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<EducationChangeRequest> findByOrganizationIdWithPagination(
            @Param("organizationId") Integer organizationId,
            @Param("limit") int limit,
            @Param("offset") long offset);

    @Query("SELECT COUNT(*) FROM education_change_requests WHERE organization_id = :organizationId")
    Mono<Long> countByOrganizationId(@Param("organizationId") Integer organizationId);

    @Query("SELECT * FROM education_change_requests WHERE organization_id = :organizationId AND status = :status ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<EducationChangeRequest> findByOrganizationIdAndStatusWithPagination(
            @Param("organizationId") Integer organizationId,
            @Param("status") Status status,
            @Param("limit") int limit,
            @Param("offset") long offset);

    @Query("SELECT COUNT(*) FROM education_change_requests WHERE organization_id = :organizationId AND status = :status")
    Mono<Long> countByOrganizationIdAndStatus(
            @Param("organizationId") Integer organizationId,
            @Param("status") Status status);
}
