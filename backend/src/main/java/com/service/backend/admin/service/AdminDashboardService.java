package com.service.backend.admin.service;

import com.service.backend.admin.dao.*;
import com.service.backend.fundraising.dao.FundDonationsR2dbcRepository;
import com.service.backend.fundraising.dao.FundR2dbcRepository;
import com.service.backend.admin.dto.*;
import com.service.backend.user.dao.UserOrganizationMemberRepository;
import com.service.backend.user.dao.PeerVerificationRepository;
import com.service.backend.forum.dao.ForumPostReportRepository;
import com.service.backend.article.dao.JobR2dbcRepository;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.entity.AdminAuditLog;
import com.service.backend.shared.enums.Status;
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
import java.util.List;
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

    // New repositories for dashboard enhancements
    private final UserOrganizationMemberRepository userOrganizationMemberRepository;
    private final PeerVerificationRepository peerVerificationRepository;
    private final AdminMentorshipRepository adminMentorshipRepository;
    private final ForumPostReportRepository forumPostReportRepository;
    private final JobR2dbcRepository jobR2dbcRepository;
    private final FundR2dbcRepository fundR2dbcRepository;

    public Mono<DashboardMetricsDTO> getMetrics() {
        Supplier<Mono<DashboardMetricsDTO>> supplier = () -> {
            Mono<Long> totalUsersMono = adminUserRepository.countAllUsers();
            Mono<Long> totalOrgsMono = adminOrganizationRepository.count();
            Mono<Long> pendingVerifMono = adminUserRepository.countPendingVerificationRequests();
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
        int limit = size;
        int offset = page * size;

        Flux<ActivityItemDTO> items = adminAuditLogRepository.findAdminActionLogs(null, null, null, limit, offset)
                .map(this::toDto);

        Mono<Long> total = adminAuditLogRepository.countAdminActionLogs(null, null, null);

        return items.collectList()
                .zipWith(total)
                .map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, size))
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

    public Mono<GlobalOverviewDTO> getGlobalOverview() {
        return Mono.zip(
                adminOrganizationRepository.countActiveOrganizations(),
                userOrganizationMemberRepository.count(),
                userOrganizationMemberRepository.countByVerificationLevel(1),
                userOrganizationMemberRepository.countByVerificationLevel(2),
                userOrganizationMemberRepository.countNewMembershipsThisMonth()
        ).map(t -> GlobalOverviewDTO.builder()
                .activeOrganizations(t.getT1())
                .totalMemberships(t.getT2())
                .level1Accounts(t.getT3())
                .level2Accounts(t.getT4())
                .newMembershipsThisMonth(t.getT5())
                .build());
    }

    public Mono<PendingWorkloadDTO> getPendingWorkload() {
        return Mono.zip(
                adminUserRepository.countPendingVerificationRequests(),
                peerVerificationRepository.countByStatus("PENDING"),
                adminMentorshipRepository.countMentorProfilesByStatus("PENDING"),
                forumPostReportRepository.countByStatus(Status.PENDING)
        ).map(t -> PendingWorkloadDTO.builder()
                .pendingOCR(t.getT1())
                .pendingReferrals(t.getT2())
                .pendingMentorApplications(t.getT3())
                .pendingForumPosts(0) // Placeholder
                .pendingReports(t.getT4())
                .build());
    }

    public Mono<OrganizationComparisonDTO> getOrganizationComparison() {
        return adminOrganizationRepository.findAll()
                .flatMap(org -> {
                    Integer orgId = org.getId();
                    return Mono.zip(
                        adminUserRepository.countUsersByOrganization(orgId),
                        adminEventRepository.countEventsByOrganization(orgId.longValue()),
                        jobR2dbcRepository.countByOrganizationId(orgId),
                        fundR2dbcRepository.countByOrganizationId(orgId)
                    ).map(t -> OrganizationMetricDTO.builder()
                        .organizationId(orgId)
                        .organizationName(org.getName())
                        .memberCount(t.getT1())
                        .eventCount(t.getT2())
                        .jobCount(t.getT3())
                        .fundraisingCount(t.getT4())
                        .build());
                })
                .collectList()
                .map(list -> new OrganizationComparisonDTO(list));
    }

    public Mono<FeatureUsageDTO> getFeatureUsageSummary() {
        return adminOrganizationRepository.findAll()
                .collectList()
                .map(orgs -> {
                    Map<String, Long> featureCount = new HashMap<>();
                    Map<Integer, List<String>> orgFeatures = new HashMap<>();
                    for (var org : orgs) {
                        List<String> features = parseFeatures(org.getFeaturesConfig());
                        orgFeatures.put(org.getId(), features);
                        for (String f : features) {
                            featureCount.put(f, featureCount.getOrDefault(f, 0L) + 1);
                        }
                    }
                    return new FeatureUsageDTO(featureCount, orgFeatures);
                });
    }

    private List<String> parseFeatures(String config) {
        if (config == null || config.isEmpty()) return List.of();
        try {
            // Placeholder: parse JSON or comma separated string
            return List.of(config.split(","));
        } catch (Exception e) {
            return List.of();
        }
    }

    public Mono<ModerationSummaryDTO> getModerationSummary() {
        return Mono.zip(
                forumPostReportRepository.countByReason().collectList(),
                forumPostReportRepository.getAverageResolutionTimeHours().defaultIfEmpty(0.0),
                forumPostReportRepository.findFlaggedOrganizations(5).collectList()
        ).map(t -> {
            Map<String, Long> reportsByType = new HashMap<>();
            // Map the results if needed, for now placeholder
            return ModerationSummaryDTO.builder()
                    .reportsByType(reportsByType)
                    .averageResolutionTimeHours(t.getT2())
                    .flaggedOrganizations(List.of()) // Placeholder
                    .build();
        });
    }

    public Mono<SystemHealthDTO> getSystemHealth() {
        return jobR2dbcRepository.countActiveJobs()
                .map(count -> SystemHealthDTO.builder()
                        .apiErrorRate(0.0) // Mocked
                        .activeJobsCount(count)
                        .storageUsed("N/A") // Mocked
                        .jobStatus(Map.of()) // Mocked
                        .build());
    }
}
