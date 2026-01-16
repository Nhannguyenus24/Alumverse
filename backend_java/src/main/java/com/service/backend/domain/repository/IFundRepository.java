package com.service.backend.domain.repository;

import com.service.backend.domain.entity.Fund;
import com.service.backend.domain.entity.FundReceivingInfo;
import com.service.backend.domain.entity.FundDonation;
import com.service.backend.domain.entity.FundExpense;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Repository interface for fund and donation management operations
 */
public interface IFundRepository {

    // Fund Management
    Mono<Fund> createFund(Fund fundData);
    Mono<Fund> updateFund(Long fundId, Fund fundData);
    Mono<Boolean> deleteFund(Long fundId);
    Mono<Fund> findFundById(Long fundId);
    Mono<Map<String, Object>> findFundsByOrganization(Long organizationId, int page, int limit, Map<String, Object> filters);
    Mono<Fund> updateFundAmount(Long fundId, BigDecimal amount);
    Mono<Fund> updateFundStatus(Long fundId, String status);

    // Fund Receiving Info Management
    Mono<FundReceivingInfo> createReceivingInfo(FundReceivingInfo receivingInfoData);
    Mono<FundReceivingInfo> updateReceivingInfo(Long receivingInfoId, FundReceivingInfo receivingInfoData);
    Mono<Boolean> deleteReceivingInfo(Long receivingInfoId);
    Flux<FundReceivingInfo> findReceivingInfosByFund(Long fundId);
    Flux<FundReceivingInfo> findActiveReceivingInfosByFund(Long fundId);
    Mono<FundReceivingInfo> toggleReceivingInfoStatus(Long receivingInfoId, Boolean isActive);

    // Donation Management
    Mono<FundDonation> createDonation(FundDonation donationData);
    Mono<FundDonation> updateDonation(Long donationId, FundDonation donationData);
    Mono<FundDonation> findDonationById(Long donationId);
    Mono<Map<String, Object>> findDonationsByFund(Long fundId, int page, int limit, Map<String, Object> filters);
    Mono<Map<String, Object>> findDonationsByDonor(Long donorMemberId, int page, int limit);
    Mono<FundDonation> approveDonation(Long donationId);
    Mono<FundDonation> rejectDonation(Long donationId);

    // Expense Management
    Mono<FundExpense> createExpense(FundExpense expenseData);
    Mono<FundExpense> updateExpense(Long expenseId, FundExpense expenseData);
    Mono<Boolean> deleteExpense(Long expenseId);
    Mono<FundExpense> findExpenseById(Long expenseId);
    Mono<Map<String, Object>> findExpensesByFund(Long fundId, int page, int limit);

    // Statistics & Reports
    Mono<Map<String, Object>> getFundStatistics(Long fundId);
    Mono<BigDecimal> getTotalDonationsByFund(Long fundId);
    Mono<BigDecimal> getTotalExpensesByFund(Long fundId);
}
