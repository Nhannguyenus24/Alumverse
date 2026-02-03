package com.service.backend.article.dao;

import com.service.backend.article.domain.entity.Job;
import com.service.backend.article.domain.repository.IJobRepository;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Repository
@RequiredArgsConstructor
public class JobRepository implements IJobRepository {

    private final JobR2dbcRepository jobRepo;

    @Override
    public Mono<Job> create(Job job) {
        job.setCreatedAt(LocalDateTime.now());
        job.setIsActive(true);
        return jobRepo.save(job);
    }

    @Override
    public Mono<Job> update(Integer id, Job job) {
        return jobRepo.findById(id)
                .flatMap(existing -> {
                    existing.setTitle(job.getTitle());
                    existing.setDescription(job.getDescription());
                    existing.setCompanyName(job.getCompanyName());
                    existing.setLocation(job.getLocation());
                    existing.setType(job.getType());
                    existing.setSalaryRange(job.getSalaryRange());
                    existing.setHowToApply(job.getHowToApply());
                    existing.setDeadline(job.getDeadline());
                    existing.setIsReferral(job.getIsReferral());
                    return jobRepo.save(existing);
                });
    }

    @Override
    public Mono<Boolean> delete(Integer id) {
        return jobRepo.deleteById(id).thenReturn(true);
    }

    @Override
    public Mono<Job> findById(Integer id) {
        return jobRepo.findById(id);
    }

    @Override
    public Mono<PaginatedResponse<Job>> findByOrganizationId(Integer organizationId, int page, int limit) {
        int offset = page * limit;
        return jobRepo.findByOrganizationIdWithPagination(organizationId, limit, offset)
                .collectList()
                .zipWith(jobRepo.countByOrganizationId(organizationId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<PaginatedResponse<Job>> findActive(Integer organizationId, int page, int limit) {
        int offset = page * limit;
        return jobRepo.findActiveByOrganizationId(organizationId, limit, offset)
                .collectList()
                .zipWith(jobRepo.countActiveByOrganizationId(organizationId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<PaginatedResponse<Job>> findOpenJobs(Integer organizationId, int page, int limit) {
        int offset = page * limit;
        LocalDate today = LocalDate.now();
        return jobRepo.findOpenJobs(organizationId, today, limit, offset)
                .collectList()
                .zipWith(jobRepo.countOpenJobs(organizationId, today))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<PaginatedResponse<Job>> search(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        return jobRepo.searchJobs(organizationId, keyword, limit, offset)
                .collectList()
                .zipWith(jobRepo.countSearchJobs(organizationId, keyword))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<Job> activate(Integer id) {
        return jobRepo.activateJob(id)
                .then(jobRepo.findById(id));
    }

    @Override
    public Mono<Job> deactivate(Integer id) {
        return jobRepo.deactivateJob(id)
                .then(jobRepo.findById(id));
    }
}
