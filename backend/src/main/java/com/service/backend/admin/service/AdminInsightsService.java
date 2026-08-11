package com.service.backend.admin.service;

import com.service.backend.admin.dao.AdminInsightsRepository;
import com.service.backend.admin.dao.AuditRepository;
import com.service.backend.admin.dto.CohortStatsDTO;
import com.service.backend.admin.dto.EngagementStatsDTO;
import com.service.backend.admin.dto.FunnelStatsDTO;
import com.service.backend.admin.dto.PlatformStatsDTO;
import com.service.backend.admin.dto.StatPoint;
import com.service.backend.shared.projection.KeyCountProjection;
import com.service.backend.shared.utils.CacheNames;
import com.service.backend.shared.utils.CacheUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Computes the extended admin dashboard insight aggregates (funnels, cohorts,
 * engagement, platform health). Each public method is cached for 5 minutes to
 * mirror {@link AdminDashboardService#getMetrics}.
 */
@Service
@RequiredArgsConstructor
public class AdminInsightsService {

    private static final Duration TTL = Duration.ofMinutes(5);

    private final AdminInsightsRepository repo;
    private final AuditRepository auditRepository;
    private final CacheUtils cacheUtils;

    // ----------------------------- helpers -----------------------------

    private static StatPoint sp(String name, long value) {
        return new StatPoint(name, value);
    }

    /** Percentage (0-100, 2 decimals) of {@code num} over {@code den}, guarding division by zero. */
    private static double rate(long num, long den) {
        return den <= 0 ? 0.0 : Math.round(num * 10000.0 / den) / 100.0;
    }

    private static Mono<List<StatPoint>> toPoints(Flux<KeyCountProjection> flux) {
        return flux.map(p -> sp(p.getKey() == null ? "unknown" : p.getKey(), p.getCount() == null ? 0L : p.getCount()))
                .collectList();
    }

    private static long sum(Map<String, Long> map) {
        return map.values().stream().mapToLong(v -> v == null ? 0L : v).sum();
    }

    private static long get(Map<String, Long> map, String... keys) {
        long total = 0;
        for (String k : keys) {
            Long v = map.get(k);
            if (v != null) total += v;
        }
        return total;
    }

    /**
     * Sum counts for every numeric verification-level key {@code >= minLevel}. The
     * distribution keys are the raw {@code verification_level} values cast to text
     * ("0".."4"); membership is verified at level {@code >= 2} across the codebase, and
     * levels can exceed 2, so exact-key matching would silently drop higher levels.
     */
    private static long atLeastLevel(Map<String, Long> map, int minLevel) {
        long total = 0;
        for (Map.Entry<String, Long> e : map.entrySet()) {
            if (e.getKey() == null || e.getValue() == null) continue;
            try {
                if (Integer.parseInt(e.getKey().trim()) >= minLevel) {
                    total += e.getValue();
                }
            } catch (NumberFormatException ignored) {
                // non-numeric key (e.g. "unknown") is not a verification level
            }
        }
        return total;
    }

    // ----------------------------- funnels -----------------------------

    public Mono<FunnelStatsDTO> getFunnels() {
        return cacheUtils.getOrCompute(CacheNames.ADMIN_FUNNELS, "global", TTL, this::computeFunnels);
    }

    private Mono<FunnelStatsDTO> computeFunnels() {
        Mono<Map<String, Long>> verif = repo.verificationLevelDistribution()
                .collectMap(KeyCountProjection::getKey, KeyCountProjection::getCount);
        Mono<Map<String, Long>> donation = repo.donationStatusDistribution()
                .collectMap(KeyCountProjection::getKey, KeyCountProjection::getCount);
        Mono<Map<String, Long>> mentor = repo.mentorStatusDistribution()
                .collectMap(KeyCountProjection::getKey, KeyCountProjection::getCount);
        Mono<Map<String, Long>> session = repo.sessionStatusDistribution()
                .collectMap(KeyCountProjection::getKey, KeyCountProjection::getCount);

        return Mono.zip(
                        verif,
                        repo.sumEventInterested(),
                        repo.countActiveTickets(),
                        repo.countCheckedInTickets(),
                        repo.sumEventCapacity(),
                        donation,
                        mentor,
                        session)
                .map(t -> {
                    Map<String, Long> verifMap = t.getT1();
                    long interested = t.getT2();
                    long registered = t.getT3();
                    long checkedIn = t.getT4();
                    long capacity = t.getT5();
                    Map<String, Long> donMap = t.getT6();
                    Map<String, Long> mentorMap = t.getT7();
                    Map<String, Long> sessMap = t.getT8();

                    // Verification: total active members -> requested (level >= 1) -> accepted (level >= 2)
                    long members = sum(verifMap);
                    long requested = atLeastLevel(verifMap, 1);
                    long accepted = atLeastLevel(verifMap, 2);

                    // Donation: total -> success (failed/pending shown as separate stages)
                    long donTotal = sum(donMap);
                    long success = get(donMap, "SUCCESS");

                    // Mentor approval: submitted (not draft) -> approved
                    long mentorTotal = sum(mentorMap);
                    long submitted = mentorTotal - get(mentorMap, "DRAFT");
                    long approved = get(mentorMap, "APPROVED");

                    // Mentorship sessions: booked -> confirmed -> completed
                    long sessTotal = sum(sessMap);
                    long confirmed = get(sessMap, "CONFIRMED", "IN_PROGRESS", "COMPLETED");
                    long completed = get(sessMap, "COMPLETED");

                    return FunnelStatsDTO.builder()
                            .verification(List.of(
                                    sp("members", members),
                                    sp("requested", requested),
                                    sp("accepted", accepted)))
                            .event(List.of(
                                    sp("interested", interested),
                                    sp("registered", registered),
                                    sp("checkedIn", checkedIn)))
                            .donation(List.of(
                                    sp("initiated", donTotal),
                                    sp("success", success),
                                    sp("pending", get(donMap, "PENDING")),
                                    sp("failed", get(donMap, "FAILED"))))
                            .mentorApproval(List.of(
                                    sp("submitted", submitted),
                                    sp("approved", approved)))
                            .mentorshipSession(List.of(
                                    sp("booked", sessTotal),
                                    sp("confirmed", confirmed),
                                    sp("completed", completed)))
                            .verificationRate(rate(accepted, requested))
                            .eventCheckinRate(rate(checkedIn, registered))
                            .eventCapacityFillRate(rate(registered, capacity))
                            .donationSuccessRate(rate(success, donTotal))
                            .mentorApprovalRate(rate(approved, submitted))
                            .sessionCompletionRate(rate(completed, sessTotal))
                            .build();
                });
    }

    // ----------------------------- cohort ------------------------------

    public Mono<CohortStatsDTO> getCohorts() {
        return cacheUtils.getOrCompute(CacheNames.ADMIN_COHORTS, "global", TTL, this::computeCohorts);
    }

    private Mono<CohortStatsDTO> computeCohorts() {
        return Mono.zip(
                        toPoints(repo.startedYearDistribution()),
                        toPoints(repo.graduatedYearDistribution()),
                        toPoints(repo.graduationStatusDistribution()),
                        toPoints(repo.genderDistribution()),
                        toPoints(repo.ageBucketDistribution()),
                        toPoints(repo.verificationLevelDistribution()))
                .map(t -> CohortStatsDTO.builder()
                        .byStartedYear(t.getT1())
                        .byGraduatedYear(t.getT2())
                        .byGraduationStatus(t.getT3())
                        .byGender(t.getT4())
                        .byAgeBucket(t.getT5())
                        .byVerificationLevel(t.getT6())
                        .build());
    }

    // --------------------------- engagement ----------------------------

    public Mono<EngagementStatsDTO> getEngagement(LocalDateTime from, LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);
        return cacheUtils.getOrCompute(CacheNames.ADMIN_ENGAGEMENT, "global|" + start + "|" + end, TTL,
                () -> computeEngagement(start, end));
    }

    // DAU/WAU/MAU stickiness stay fixed standard windows; the time-series charts
    // (loginsByHour, loginsByMethod, dailyLogins) follow the selected [start, end) window.
    private Mono<EngagementStatsDTO> computeEngagement(LocalDateTime start, LocalDateTime end) {
        Mono<List<StatPoint>> dailyLogins = auditRepository.getDailyLoginStatsBetween(start, end)
                .map(p -> sp(p.getDate() == null ? "" : p.getDate().toString(), p.getCount() == null ? 0L : p.getCount()))
                .collectList();
        Mono<List<StatPoint>> loginsByMethod = auditRepository.getLoginMethodStatsBetween(start, end)
                .map(p -> sp(p.getMethod() == null ? "unknown" : p.getMethod(), p.getCount() == null ? 0L : p.getCount()))
                .collectList();

        return Mono.zip(
                        auditRepository.countDailyActive(),
                        repo.countWeeklyActive(),
                        repo.countMonthlyActive(),
                        toPoints(repo.loginsByHourBetween(start, end)),
                        loginsByMethod,
                        dailyLogins)
                .map(t -> {
                    long dau = t.getT1();
                    long mau = t.getT3();
                    return EngagementStatsDTO.builder()
                            .dailyActiveUsers(dau)
                            .weeklyActiveUsers(t.getT2())
                            .monthlyActiveUsers(mau)
                            .stickiness(rate(dau, mau))
                            .loginsByHour(t.getT4())
                            .loginsByMethod(t.getT5())
                            .dailyLogins(t.getT6())
                            .build();
                });
    }

    // ---------------------------- platform -----------------------------

    public Mono<PlatformStatsDTO> getPlatform(LocalDateTime from, LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);
        return cacheUtils.getOrCompute(CacheNames.ADMIN_PLATFORM, "global|" + start + "|" + end, TTL,
                () -> computePlatform(start, end));
    }

    // Only the messages-by-day time-series follows the window; totals/distributions stay all-time.
    private Mono<PlatformStatsDTO> computePlatform(LocalDateTime start, LocalDateTime end) {
        Mono<List<StatPoint>> messagesByDay = repo.chatMessagesByDayBetween(start, end)
                .map(p -> sp(p.getDate() == null ? "" : p.getDate().toString(), p.getCount() == null ? 0L : p.getCount()))
                .collectList();

        Mono<PlatformStatsDTO.ChatStats> chat = Mono.zip(
                        repo.countChatMessages(),
                        repo.countChatGroups(),
                        repo.countUserBlocks(),
                        toPoints(repo.chatGroupsByType()),
                        messagesByDay,
                        toPoints(repo.chatRequestsByStatus()))
                .map(t -> PlatformStatsDTO.ChatStats.builder()
                        .totalMessages(t.getT1())
                        .totalGroups(t.getT2())
                        .totalBlocks(t.getT3())
                        .groupsByType(t.getT4())
                        .messagesByDay(t.getT5())
                        .requestsByStatus(t.getT6())
                        .build());

        Mono<List<PlatformStatsDTO.OrgComparison>> orgs = repo.orgComparison(8)
                .map(p -> PlatformStatsDTO.OrgComparison.builder()
                        .name(p.getName())
                        .members(p.getMembers())
                        .events(p.getEvents())
                        .topics(p.getTopics())
                        .jobs(p.getJobs())
                        .build())
                .collectList();

        Mono<PlatformStatsDTO.QualityStats> quality = Mono.zip(
                        repo.avgSessionRating(),
                        toPoints(repo.sessionRatingDistribution()),
                        toPoints(repo.mentorReportsByStatus()),
                        toPoints(repo.forumReportsByStatus()))
                .map(t -> PlatformStatsDTO.QualityStats.builder()
                        .avgSessionRating(Math.round(t.getT1() * 100) / 100.0)
                        .ratingDistribution(t.getT2())
                        .mentorReportsByStatus(t.getT3())
                        .forumReportsByStatus(t.getT4())
                        .build());

        return Mono.zip(chat, orgs, quality)
                .map(t -> PlatformStatsDTO.builder()
                        .chat(t.getT1())
                        .orgComparison(t.getT2())
                        .quality(t.getT3())
                        .build());
    }
}
