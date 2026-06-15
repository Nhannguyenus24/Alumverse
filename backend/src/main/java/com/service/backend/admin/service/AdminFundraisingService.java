package com.service.backend.admin.service;

import com.service.backend.admin.dto.FundraisingStatisticsDTO;
import com.service.backend.fundraising.dao.FundDonationsR2dbcRepository;
import com.service.backend.fundraising.dao.FundR2dbcRepository;
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

        Mono<Long> totalFundsMono = fundRepository.countAll();
        Mono<Long> activeFundsMono = fundRepository.countOpenFunds(now);
        Mono<Long> completedFundsMono = fundRepository.countCompletedFunds();
        Mono<BigDecimal> totalTargetMono = fundRepository.sumTargetAmount().defaultIfEmpty(BigDecimal.ZERO);
        Mono<BigDecimal> totalRaisedMono = fundRepository.sumCurrentAmount().defaultIfEmpty(BigDecimal.ZERO);

        Mono<Long> totalDonationsMono = fundDonationsRepository.countAllDonations();
        Mono<Long> successfulDonationsMono = fundDonationsRepository.countByStatus("SUCCESS");
        Mono<Long> pendingDonationsMono = fundDonationsRepository.countByStatus("PENDING");
        Mono<Long> failedDonationsMono = fundDonationsRepository.countByStatus("FAILED");
        Mono<BigDecimal> successfulAmountMono = fundDonationsRepository.sumSuccessfulAmount().defaultIfEmpty(BigDecimal.ZERO);

        Mono<List<FundraisingStatisticsDTO.FundSummary>> topFundsMono = fundRepository.findTopByCurrentAmount(5)
                .map(this::toFundSummary)
                .collectList();

        Mono<List<FundraisingStatisticsDTO.DayCount>> timelineMono = fundDonationsRepository.getDailyDonationCounts()
                .map(this::toDayCount)
                .collectList();

        return Mono.zip(
                totalFundsMono, activeFundsMono, completedFundsMono,
                totalTargetMono, totalRaisedMono,
                totalDonationsMono, successfulDonationsMono, pendingDonationsMono
        ).flatMap(t1 -> Mono.zip(
                failedDonationsMono, successfulAmountMono, topFundsMono, timelineMono
        ).map(t2 -> FundraisingStatisticsDTO.builder()
                .totalFunds(t1.getT1())
                .activeFunds(t1.getT2())
                .completedFunds(t1.getT3())
                .totalTarget(t1.getT4())
                .totalRaised(t1.getT5())
                .totalDonations(t1.getT6())
                .successfulDonations(t1.getT7())
                .pendingDonations(t1.getT8())
                .failedDonations(t2.getT1())
                .successfulAmount(t2.getT2())
                .topFundsByRaised(t2.getT3())
                .donationTimeline(t2.getT4())
                .build()))
                .doOnSuccess(r -> log.info("getFundraisingStatistics completed"))
                .doOnError(e -> log.error("Error fetching fundraising statistics", e));
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
