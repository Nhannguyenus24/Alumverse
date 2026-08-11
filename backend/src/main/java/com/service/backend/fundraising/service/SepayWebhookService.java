package com.service.backend.fundraising.service;

import com.service.backend.fundraising.dao.FundDonationsR2dbcRepository;
import com.service.backend.fundraising.dao.FundR2dbcRepository;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.CacheNames;
import com.service.backend.shared.utils.CacheUtils;
import java.math.BigDecimal;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class SepayWebhookService {

    private static final String AUTH_PREFIX = "Apikey ";
    private static final Pattern DONATION_ID_PATTERN = Pattern.compile("\\bFD(\\d+)\\b");

    private final FundDonationsR2dbcRepository fundDonationsRepository;
    private final FundR2dbcRepository fundRepository;
    private final CacheUtils cacheUtils;

    @Value("${sepay.api-key}")
    private String sepayApiKey;

    @Transactional
    public Mono<Map<String, Boolean>> processWebhook(String authorizationHeader, Map<String, Object> body) {
        validateAuthorizationHeader(authorizationHeader);

        String transferType = getStringField(body, "transferType");
        if (!"in".equals(transferType)) {
            log.info("Ignore SePay webhook because transferType is not 'in': {}", transferType);
            return Mono.just(Map.of("success", true));
        }

        int donationId = extractDonationIdFromContent(body);
        long sepayTransactionId = getRequiredPositiveLong(body, "id");
        BigDecimal transferAmount = getRequiredPositiveAmount(body, "transferAmount");
        String receivingAccountNumber = getRequiredString(body, "accountNumber");

        return fundDonationsRepository.findById(donationId)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.RESOURCES_NOT_FOUND,
                        "Fund donation not found with id: " + donationId
                )))
                .flatMap(existing -> receivingAccountMatches(existing.getFundId(), receivingAccountNumber)
                        .flatMap(matches -> {
                            if (!matches) {
                                log.warn(
                                        "Ignore SePay webhook because receiving account does not match the fund. "
                                                + "donationId={}, sepayTransactionId={}, accountNumber={}",
                                        donationId, sepayTransactionId, receivingAccountNumber);
                                return Mono.empty();
                            }
                            return recordTransaction(donationId, sepayTransactionId, transferAmount);
                        }))
                .thenReturn(Map.of("success", true));
    }

    private Mono<Boolean> receivingAccountMatches(Integer fundId, String webhookAccountNumber) {
        if (fundId == null) {
            return Mono.just(false);
        }
        return fundRepository.findReceivingInfoLookupByFundId(fundId.longValue())
                .map(lookup -> lookup.getRiAccountNumber() != null
                        && lookup.getRiAccountNumber().trim().equals(webhookAccountNumber))
                .defaultIfEmpty(false);
    }

    private Mono<Void> recordTransaction(
            int sourceDonationId,
            long sepayTransactionId,
            BigDecimal transferAmount) {
        return fundDonationsRepository
                .claimPendingDonation(sourceDonationId, sepayTransactionId, transferAmount)
                .switchIfEmpty(Mono.defer(() -> fundDonationsRepository.insertAdditionalDonation(
                        sourceDonationId, sepayTransactionId, transferAmount)))
                .flatMap(saved -> fundRepository
                        .incrementDonorCountAndAmount(saved.getFundId(), saved.getAmount())
                        .flatMap(updatedRows -> {
                            if (updatedRows != null && updatedRows == 1) {
                                return Mono.just(saved);
                            }
                            return Mono.error(new ApplicationException(
                                    ErrorCode.INTERNAL_SERVER_ERROR,
                                    "Failed to update fund totals for donation id: " + saved.getId()));
                        }))
                // The accepted transaction now counts toward the aggregated fund stats.
                .delayUntil(saved -> cacheUtils.clear(CacheNames.FUND_STATISTICS))
                .then();
    }

    private void validateAuthorizationHeader(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            log.warn("Missing Authorization header in SePay webhook");
            throw new ApplicationException(ErrorCode.FORBIDDEN, "Missing Authorization header");
        }
        if (!authorizationHeader.startsWith(AUTH_PREFIX)) {
            log.warn("Invalid Authorization header format in SePay webhook: {}", authorizationHeader);
            throw new ApplicationException(ErrorCode.FORBIDDEN, "Invalid Authorization header format");
        }
        String incomingApiKey = authorizationHeader.substring(AUTH_PREFIX.length()).trim();
        // Constant-time comparison to avoid leaking the key length/prefix via timing side-channels.
        boolean matches = java.security.MessageDigest.isEqual(
                sepayApiKey.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                incomingApiKey.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        if (!matches) {
            log.warn("SePay webhook api key mismatch");
            throw new ApplicationException(ErrorCode.FORBIDDEN, "Invalid SePay api key");
        }
    }

    private int extractDonationIdFromContent(Map<String, Object> body) {
        String content = getStringField(body, "content");
        if (content == null || content.isBlank()) {
            log.warn("SePay webhook content is null/blank");
            throw new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Webhook content is empty");
        }

        Matcher matcher = DONATION_ID_PATTERN.matcher(content);
        Integer donationId = null;
        while (matcher.find()) {
            donationId = Integer.parseInt(matcher.group(1));
        }
        if (donationId == null) {
            log.warn("Cannot find donation marker FD<id> in SePay webhook content. content='{}'", content);
            throw new ApplicationException(
                ErrorCode.RESOURCES_NOT_FOUND,
                "Cannot parse fund donation id from webhook content"
            );
        }
        return donationId;
    }

    private String getStringField(Map<String, Object> body, String field) {
        Object raw = body.get(field);
        return raw == null ? null : String.valueOf(raw);
    }

    private String getRequiredString(Map<String, Object> body, String field) {
        String value = getStringField(body, field);
        if (value == null || value.isBlank()) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Missing SePay webhook field: " + field);
        }
        return value.trim();
    }

    private long getRequiredPositiveLong(Map<String, Object> body, String field) {
        String value = getRequiredString(body, field);
        try {
            long parsed = Long.parseLong(value);
            if (parsed <= 0) {
                throw new NumberFormatException("not positive");
            }
            return parsed;
        } catch (NumberFormatException ex) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Invalid SePay webhook field: " + field);
        }
    }

    private BigDecimal getRequiredPositiveAmount(Map<String, Object> body, String field) {
        String value = getRequiredString(body, field);
        try {
            BigDecimal amount = new BigDecimal(value);
            if (amount.signum() <= 0) {
                throw new NumberFormatException("not positive");
            }
            return amount;
        } catch (NumberFormatException ex) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Invalid SePay webhook field: " + field);
        }
    }
}
