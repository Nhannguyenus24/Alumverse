package com.service.backend.admin.service;

import com.service.backend.admin.dao.AuditRepository;
import com.service.backend.admin.dto.LoginHistoryResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AuditService {

    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);

    private final AuditRepository auditRepository;

    public AuditService(AuditRepository auditRepository) {
        this.auditRepository = auditRepository;
    }

    public Mono<PaginatedResponse<LoginHistoryResponse>> getLoginHistories(int page, int size) {
        logger.info("Fetching login histories page={} size={}", page, size);
        int offset = page * size;
        return Mono.zip(
                auditRepository.findAllWithUserInfo(size, offset).collectList(),
                auditRepository.countAll()
        ).map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, size))
         .doOnError(e -> logger.error("Error fetching login histories", e));
    }

    public Mono<PaginatedResponse<LoginHistoryResponse>> getLoginHistoriesByUser(Integer userId, int page, int size) {
        logger.info("Fetching login histories for user={} page={} size={}", userId, page, size);
        int offset = page * size;
        return Mono.zip(
                auditRepository.findByUserIdWithUserInfo(userId, size, offset).collectList(),
                auditRepository.countByUserId(userId)
        ).map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, size))
         .doOnError(e -> logger.error("Error fetching login histories for user {}", userId, e));
    }

    public Mono<Map<String, Object>> getLoginStats() {
        logger.info("Fetching login stats");
        return Mono.zip(
                auditRepository.getLoginMethodStats().collectList(),
                auditRepository.getDailyLoginStats().collectList()
        ).map(t -> {
            Map<String, Object> stats = new HashMap<>();
            stats.put("methodStats", t.getT1());
            stats.put("dailyStats", t.getT2());
            return stats;
        }).doOnError(e -> logger.error("Error fetching login stats", e));
    }

    public Mono<List<Object>> getSuspiciousLogins() {
        logger.info("Fetching suspicious logins");
        return auditRepository.findSuspiciousLogins()
                .collectList()
                .doOnError(e -> logger.error("Error fetching suspicious logins", e));
    }
}
