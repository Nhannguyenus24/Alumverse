package com.service.backend.mentorship.dao;

import com.service.backend.shared.entity.MenteeProfile;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MenteeProfileR2dbcRepository extends ReactiveCrudRepository<MenteeProfile, Integer> {
}
