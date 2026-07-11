package com.service.backend.mentorship.dao;

import com.service.backend.shared.entity.MenteeProfile;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MenteeProfileR2dbcRepository extends R2dbcRepository<MenteeProfile, Integer> {
}
