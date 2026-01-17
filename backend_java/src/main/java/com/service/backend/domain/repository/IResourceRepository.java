package com.service.backend.domain.repository;

import com.service.backend.domain.entity.LearningResource;
import com.service.backend.domain.entity.Job;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.Map;

/**
 * Repository interface for learning resources and job posting operations
 */
public interface IResourceRepository {

    // Learning Resource Management
    Mono<LearningResource> createLearningResource(LearningResource resourceData);
    Mono<LearningResource> updateLearningResource(Long resourceId, LearningResource resourceData);
    Mono<Boolean> deleteLearningResource(Long resourceId);
    Mono<LearningResource> findLearningResourceById(Long resourceId);
    Mono<Map<String, Object>> findLearningResourcesByOrganization(Long organizationId, int page, int limit, Map<String, Object> filters);
    Mono<Map<String, Object>> findLearningResourcesByUploader(Long uploaderMemberId, int page, int limit);
    Mono<Map<String, Object>> searchLearningResources(Long organizationId, String keyword, int page, int limit);

    // Job Management
    Mono<Job> createJob(Job jobData);
    Mono<Job> updateJob(Long jobId, Job jobData);
    Mono<Boolean> deleteJob(Long jobId);
    Mono<Job> findJobById(Long jobId);
    Mono<Map<String, Object>> findJobsByOrganization(Long organizationId, int page, int limit, Map<String, Object> filters);
    Mono<Map<String, Object>> findJobsByPoster(Long posterMemberId, int page, int limit);
    Mono<Map<String, Object>> searchJobs(Long organizationId, String keyword, int page, int limit);
    Mono<Map<String, Object>> findActiveJobs(Long organizationId, int page, int limit);
    Mono<Job> activateJob(Long jobId);
    Mono<Job> deactivateJob(Long jobId);
    Mono<Map<String, Object>> findJobsByDeadline(Long organizationId, LocalDate beforeDate, int page, int limit);

    // Statistics
    Mono<Map<String, Object>> getResourceStatistics(Long organizationId);
    Mono<Map<String, Object>> getJobStatistics(Long organizationId);
}
