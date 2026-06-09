package com.service.backend.admin.service;

import com.service.backend.admin.dao.AdminEventRepository;
import com.service.backend.admin.dao.AdminOrganizationRepository;
import com.service.backend.admin.dao.AdminAuditLogRepository;
import com.service.backend.admin.dao.AuditRepository;
import com.service.backend.admin.dao.AdminUserRepository;
import com.service.backend.fundraising.dao.FundDonationsR2dbcRepository;
import com.service.backend.admin.dto.DashboardMetricsDTO;
import com.service.backend.admin.dto.ActivityItemDTO;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.entity.AdminAuditLog;
import com.service.backend.shared.utils.PaginationHelper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {
    private static final Logger log = LoggerFactory.getLogger(AdminDashboardService.class);

    private final AdminUserRepository adminUserRepository;
    private final AdminOrganizationRepository adminOrganizationRepository;
    private final AdminEventRepository adminEventRepository;
    private final FundDonationsR2dbcRepository fundDonationsRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final AuditRepository auditRepository;
    private final CacheUtils cacheUtils;

    public Mono<DashboardMetricsDTO> getMetrics() {
        Supplier<Mono<DashboardMetricsDTO>> supplier = () -> {
            Mono<Long> totalUsersMono = adminUserRepository.countAllUsers();
            Mono<Long> totalOrgsMono = adminOrganizationRepository.count();
            Mono<Long> pendingVerifMono = adminUserRepository.countPendingVerificationRequests(null);
            Mono<Long> pendingPeerVerificationsMono = adminUserRepository.countPeerVerificationsByStatus("PENDING");
            Mono<Long> totalEventsMono = adminEventRepository.countAllEvents();
            Mono<Long> upcomingEventsMono = adminEventRepository.countUpcomingEvents(LocalDateTime.now());
            Mono<Long> ticketsSoldMono = adminEventRepository.countAllTickets();
            Mono<Long> totalDonationsMono = fundDonationsRepository.countAll();
            LocalDateTime end = LocalDateTime.now();
            LocalDateTime start30 = end.minusDays(30);
            Mono<BigDecimal> donations30Mono = fundDonationsRepository.sumAmountBetween(start30, end)
                    .defaultIfEmpty(BigDecimal.ZERO);
                Mono<Long> dailyActiveMono = auditRepository.countDailyActive()
                    .onErrorResume(e -> Mono.just(0L));

            return Mono.zip(totalUsersMono, totalOrgsMono, pendingVerifMono, totalEventsMono,
                    upcomingEventsMono, ticketsSoldMono, totalDonationsMono, donations30Mono)
                    .map(tuple -> {
                        DashboardMetricsDTO dto = new DashboardMetricsDTO();
                        dto.setTotalUsers(tuple.getT1());
                        Map<String, Long> newUsers = new HashMap<>();
                        newUsers.put("7d", 0L);
                        newUsers.put("30d", 0L);
                        dto.setNewUsers(newUsers);
                        dto.setDailyActive(0L);
                        dto.setTotalOrganizations(tuple.getT2());
                        dto.setPendingVerifications(tuple.getT3());
                        dto.setTotalEvents(tuple.getT4());
                        dto.setUpcomingEvents(tuple.getT5());
                        dto.setTicketsSold(tuple.getT6());
                        dto.setTotalDonationsCount(tuple.getT7());
                        dto.setDonationsLast30Days(tuple.getT8());
                        return dto;
                    });
        };

        return cacheUtils.getOrCompute("admin:metrics", "global", Duration.ofMinutes(5), supplier)
                .doOnSuccess(dto -> log.info("getMetrics result: {}", JsonUtils.toJson(dto)));
    }

    public Mono<PaginatedResponse<ActivityItemDTO>> getActivities(int page, int size) {
        return getActivities(null, page, size);
    }

    public Mono<PaginatedResponse<ActivityItemDTO>> getActivities(Integer organizationId, int page, int size) {
        int limit = size;
        int offset = page * size;

        Flux<ActivityItemDTO> items;
        Mono<Long> total;

        if (organizationId != null) {
            items = adminAuditLogRepository.findAdminActionLogsByOrganization(organizationId, null, null, null, limit, offset)
                    .map(this::toDto);
            total = adminAuditLogRepository.countAdminActionLogsByOrganization(organizationId, null, null, null);
        } else {
            items = adminAuditLogRepository.findAdminActionLogs(null, null, null, limit, offset)
                    .map(this::toDto);
            total = adminAuditLogRepository.countAdminActionLogs(null, null, null);
        }

        return PaginationHelper.paginate(items, total, page, size)
                .flatMap(m -> cacheUtils.putWithTtl("admin:activities", "page:" + page, m, Duration.ofMinutes(1)).thenReturn(m))
                .doOnSuccess(r -> log.info("getActivities result: {}", JsonUtils.toJson(r)));
    }

    private ActivityItemDTO toDto(AdminAuditLog log) {
        ActivityItemDTO dto = new ActivityItemDTO();
        dto.setId(log.getId());
        dto.setTimestamp(log.getCreatedAt());
        dto.setAdminUserId(log.getAdminUserId());
        dto.setTargetUserId(log.getTargetUserId());
        dto.setAction(log.getAction());
        dto.setResourceType(log.getResourceType());
        dto.setResourceId(log.getResourceId());
        dto.setMetadata(log.getMetadata());
        return dto;
    }
}
