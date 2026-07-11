package com.service.backend.admin.service;

import com.service.backend.admin.dto.FundraisingStatisticsDTO;
import com.service.backend.fundraising.dao.FundDonationsR2dbcRepository;
import com.service.backend.fundraising.dao.FundR2dbcRepository;
import com.service.backend.fundraising.dto.FundDonationListItemResponse;
import com.service.backend.fundraising.mapper.FundDonationMapper;
import com.service.backend.shared.entity.Funds;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminFundraisingService {

    private static final Logger log = LoggerFactory.getLogger(AdminFundraisingService.class);

    private final FundR2dbcRepository fundRepository;
    private final FundDonationsR2dbcRepository fundDonationsRepository;

    public Mono<FundraisingStatisticsDTO> getStatistics() {
        LocalDateTime now = LocalDateTime.now();

        Mono<com.service.backend.admin.dto.AdminFundAggregatedStatsProjection> fundStatsMono = fundRepository.getAdminAggregatedFundStats(now);
        Mono<com.service.backend.admin.dto.AdminFundDonationAggregatedStatsProjection> donStatsMono = fundDonationsRepository.getAdminAggregatedDonationStats();

        Mono<List<FundraisingStatisticsDTO.FundSummary>> topFundsMono = fundRepository.findTopByCurrentAmount(5)
                .map(this::toFundSummary)
                .collectList();

        Mono<List<FundraisingStatisticsDTO.DayCount>> timelineMono = fundDonationsRepository.getDailyDonationCounts()
                .map(this::toDayCount)
                .collectList();

        return Mono.zip(fundStatsMono, donStatsMono, topFundsMono, timelineMono)
                .map(tuple -> {
                    var fStats = tuple.getT1();
                    var dStats = tuple.getT2();
                    return FundraisingStatisticsDTO.builder()
                            .totalFunds(fStats.getTotalFunds() != null ? fStats.getTotalFunds() : 0L)
                            .activeFunds(fStats.getActiveFunds() != null ? fStats.getActiveFunds() : 0L)
                            .completedFunds(fStats.getCompletedFunds() != null ? fStats.getCompletedFunds() : 0L)
                            .totalTarget(fStats.getTotalTargetAmount() != null ? fStats.getTotalTargetAmount() : BigDecimal.ZERO)
                            .totalRaised(fStats.getTotalCurrentAmount() != null ? fStats.getTotalCurrentAmount() : BigDecimal.ZERO)
                            .totalDonations(dStats.getTotalDonations() != null ? dStats.getTotalDonations() : 0L)
                            .successfulDonations(dStats.getSuccessfulDonations() != null ? dStats.getSuccessfulDonations() : 0L)
                            .pendingDonations(dStats.getPendingDonations() != null ? dStats.getPendingDonations() : 0L)
                            .failedDonations(dStats.getFailedDonations() != null ? dStats.getFailedDonations() : 0L)
                            .successfulAmount(dStats.getSuccessfulAmount() != null ? dStats.getSuccessfulAmount() : BigDecimal.ZERO)
                            .topFundsByRaised(tuple.getT3())
                            .donationTimeline(tuple.getT4())
                            .build();
                })
                .doOnSuccess(r -> log.info("getFundraisingStatistics completed"))
                .doOnError(e -> log.error("Error fetching fundraising statistics", e));
    }

    public Mono<List<FundDonationListItemResponse>> getAllDonationsByFund(long fundId) {
        return fundDonationsRepository.findAllByFundId(fundId)
                .map(FundDonationMapper::toListItemResponse)
                .collectList()
                .doOnSuccess(r -> log.info("getAllDonationsByFund completed: fundId={}, count={}", fundId, r.size()))
                .doOnError(e -> log.error("Error fetching all donations for fund: {}", fundId, e));
    }

    private FundraisingStatisticsDTO.FundSummary toFundSummary(Funds fund) {
        return FundraisingStatisticsDTO.FundSummary.builder()
                .fundId(fund.getId() != null ? fund.getId().longValue() : null)
                .name(fund.getName())
                .currentAmount(fund.getCurrentAmount())
                .targetAmount(fund.getTargetAmount())
                .donorCount(fund.getDonorCount() != null ? fund.getDonorCount().longValue() : 0L)
                .build();
    }

    private FundraisingStatisticsDTO.DayCount toDayCount(com.service.backend.shared.projection.DailyAmountProjection p) {
        return FundraisingStatisticsDTO.DayCount.builder()
                .date(p.getDate() != null ? p.getDate().toString() : "")
                .count(p.getCount() != null ? p.getCount() : 0L)
                .amount(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .build();
    }
}
