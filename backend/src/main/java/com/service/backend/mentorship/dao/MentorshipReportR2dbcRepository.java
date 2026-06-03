package com.service.backend.mentorship.dao;

import com.service.backend.shared.entity.MentorshipReport;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MentorshipReportR2dbcRepository extends ReactiveCrudRepository<MentorshipReport, Integer> {
}
