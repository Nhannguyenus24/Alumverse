package com.service.backend.admin.service;

import com.service.backend.organization.dao.OrganizationRepository;
import com.service.backend.event.dao.EventR2dbcRepository;
import com.service.backend.admin.dao.AdminAuditLogRepository;
import com.service.backend.admin.dao.AdminUserRepository;
import com.service.backend.admin.dao.AuditRepository;
import com.service.backend.fundraising.dao.FundDonationsR2dbcRepository;
import com.service.backend.admin.dto.DashboardMetricsDTO;
import com.service.backend.admin.dto.ActivityItemDTO;
import com.service.backend.shared.entity.User;
import com.service.backend.shared.utils.CacheNames;
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
import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {
    private static final Logger log = LoggerFactory.getLogger(AdminDashboardService.class);

    private final AdminUserRepository adminUserRepository;
    private final OrganizationRepository organizationRepository;
    private final EventR2dbcRepository eventRepo;
    private final FundDonationsR2dbcRepository fundDonationsRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final AuditRepository auditRepository;
    private final CacheUtils cacheUtils;

    public Mono<DashboardMetricsDTO> getMetrics(LocalDateTime from, LocalDateTime to) {
        // Point-in-time totals stay all-time; only the range-based fields (new users,
        // donations, active users) follow the selected [start, end) window.
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);

        Supplier<Mono<DashboardMetricsDTO>> supplier = () -> {
            Mono<Long> totalUsersMono = adminUserRepository.countAllUsers();
            Mono<Long> totalOrgsMono = organizationRepository.count();
            Mono<Long> pendingVerifMono = adminUserRepository.countPendingVerificationRequests(null);
            Mono<Long> totalEventsMono = eventRepo.countAllEvents();
            Mono<Long> upcomingEventsMono = eventRepo.countUpcomingEvents(LocalDateTime.now());
            Mono<Long> ticketsSoldMono = eventRepo.countAllTickets();
            Mono<Long> totalDonationsMono = fundDonationsRepository.countAll();
            Mono<BigDecimal> donationsRangeMono = fundDonationsRepository.sumAmountBetween(start, end)
                    .defaultIfEmpty(BigDecimal.ZERO);
            Mono<Long> newUsersRangeMono = adminUserRepository.countUsersCreatedBetween(start, end).defaultIfEmpty(0L);

            return Mono.zip(totalUsersMono, totalOrgsMono, pendingVerifMono, totalEventsMono,
                    upcomingEventsMono, ticketsSoldMono, totalDonationsMono, donationsRangeMono)
                    .map(tuple -> {
                        DashboardMetricsDTO dto = new DashboardMetricsDTO();
                        dto.setTotalUsers(tuple.getT1());
                        dto.setDailyActive(0L);
                        dto.setTotalOrganizations(tuple.getT2());
                        dto.setPendingVerifications(tuple.getT3());
                        dto.setTotalEvents(tuple.getT4());
                        dto.setUpcomingEvents(tuple.getT5());
                        dto.setTicketsSold(tuple.getT6());
                        dto.setTotalDonationsCount(tuple.getT7());
                        dto.setDonationsLast30Days(tuple.getT8());
                        return dto;
                    })
                    .flatMap(dto -> Mono.zip(
                                    auditRepository.countActiveBetween(start, end).defaultIfEmpty(0L),
                                    newUsersRangeMono)
                            .map(t -> {
                                dto.setDailyActive(t.getT1());
                                Map<String, Long> newUsers = new HashMap<>();
                                newUsers.put("range", t.getT2());
                                dto.setNewUsers(newUsers);
                                return dto;
                            }))
                    .doOnSuccess(dto -> log.debug("getMetrics result: {}", JsonUtils.toJson(dto)));
        };

        // Window is part of the cache key so different ranges don't serve each other's data.
        String cacheKey = "global|" + start + "|" + end;
        return cacheUtils.getOrCompute(CacheNames.ADMIN_METRICS, cacheKey, Duration.ofMinutes(5), supplier);
    }

    public Mono<PaginatedResponse<ActivityItemDTO>> getActivities(Integer organizationId, int page, int size) {
        int offset = page * size;

        Flux<ActivityItemDTO> items;
        Mono<Long> total;

        if (organizationId != null) {
            items = adminAuditLogRepository.findAdminActionLogsByOrganization(organizationId, null, null, null, size, offset)
                    .map(this::toDto);
            total = adminAuditLogRepository.countAdminActionLogsByOrganization(organizationId, null, null, null);
        } else {
            items = adminAuditLogRepository.findAdminActionLogs(null, null, null, size, offset)
                    .map(this::toDto);
            total = adminAuditLogRepository.countAdminActionLogs(null, null, null);
        }

        // Activities are read straight from the audit log. No read path ever consulted the previous
        // "admin:activities" cache (write-only dead cache), so it has been removed to avoid the overhead.
        return PaginationHelper.paginate(enrichActivityActors(items), total, page, size)
                .doOnSuccess(r -> log.debug("getActivities result: {}", JsonUtils.toJson(r)));
    }

    private Flux<ActivityItemDTO> enrichActivityActors(Flux<ActivityItemDTO> items) {
        return items.collectList().flatMapMany(activityItems -> {
            if (activityItems.isEmpty()) {
                return Flux.empty();
            }

            Set<Integer> adminIds = activityItems.stream()
                    .map(ActivityItemDTO::getAdminUserId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toCollection(HashSet::new));

            if (adminIds.isEmpty()) {
                return Flux.fromIterable(activityItems);
            }

            return adminUserRepository.findAllById(adminIds)
                    .collectMap(User::getId)
                    .flatMapMany(usersById -> Flux.fromIterable(activityItems)
                            .map(item -> {
                                var user = usersById.get(item.getAdminUserId());
                                if (user != null) {
                                    item.setAdminFullName(user.getFullName());
                                    item.setAdminEmail(user.getEmail());
                                }
                                return item;
                            }));
        });
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
        dto.setBeforeData(log.getBeforeData());
        dto.setAfterData(log.getAfterData());
        dto.setMetadata(log.getMetadata());
        return dto;
    }
}
