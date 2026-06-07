package com.service.backend.admin.service;

import com.service.backend.admin.dao.AuditRepository;
import com.service.backend.admin.dto.LoginHistoryResponse;
import com.service.backend.admin.dto.SuspiciousLoginInfo;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.JsonUtils;
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
        int offset = page * size;
        return Mono.zip(
                auditRepository.findAllWithUserInfo(size, offset).collectList(),
                auditRepository.countAll()
        ).map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, size))
         .doOnSuccess(r -> logger.info("getLoginHistories result: {}", JsonUtils.toJson(r)))
         .doOnError(e -> logger.error("Error fetching login histories", e));
    }

    public Mono<PaginatedResponse<LoginHistoryResponse>> getLoginHistoriesByUser(Integer userId, int page, int size) {
        int offset = page * size;
        return Mono.zip(
                auditRepository.findByUserIdWithUserInfo(userId, size, offset).collectList(),
                auditRepository.countByUserId(userId)
        ).map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, size))
         .doOnSuccess(r -> logger.info("getLoginHistoriesByUser result: {}", JsonUtils.toJson(r)))
         .doOnError(e -> logger.error("Error fetching login histories for user {}", userId, e));
    }

    public Mono<Map<String, Object>> getLoginStats() {
        return Mono.zip(
                auditRepository.getLoginMethodStats()
                        .map(p -> Map.of("method", p.getMethod() != null ? p.getMethod() : "unknown",
                                         "count", p.getCount() != null ? p.getCount() : 0L))
                        .collectList(),
                auditRepository.getDailyLoginStats()
                        .map(p -> Map.of("date", p.getDate() != null ? p.getDate().toString() : "",
                                         "count", p.getCount() != null ? p.getCount() : 0L))
                        .collectList()
        ).map(t -> {
            Map<String, Object> stats = new HashMap<>();
            stats.put("methodStats", t.getT1());
            stats.put("dailyStats", t.getT2());
            return stats;
        })
        .doOnSuccess(r -> logger.info("getLoginStats result: {}", JsonUtils.toJson(r)))
        .doOnError(e -> logger.error("Error fetching login stats", e));
    }

    public Mono<List<SuspiciousLoginInfo>> getSuspiciousLogins() {
        return auditRepository.findSuspiciousLogins()
                .collectList()
                .doOnSuccess(r -> logger.info("getSuspiciousLogins result: {}", JsonUtils.toJson(r)))
                .doOnError(e -> logger.error("Error fetching suspicious logins", e));
    }
}
