package com.service.backend.fundraising.dao;

import com.service.backend.shared.entity.Organization;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationR2dbcRepository extends R2dbcRepository<Organization, Integer> {
}
