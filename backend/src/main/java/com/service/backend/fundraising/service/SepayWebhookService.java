package com.service.backend.fundraising.service;

import com.service.backend.fundraising.dao.FundDonationsR2dbcRepository;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.FundDonationStatus;
import com.service.backend.shared.exception.ApplicationException;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class SepayWebhookService {

    private static final String AUTH_PREFIX = "Apikey ";
    private static final Pattern DONATION_ID_PATTERN = Pattern.compile("\\bFD(\\d+)\\b");

    private final FundDonationsR2dbcRepository fundDonationsRepository;

    @Value("${sepay.api-key}")
    private String sepayApiKey;

    public Mono<Map<String, Boolean>> processWebhook(String authorizationHeader, Map<String, Object> body) {
        validateAuthorizationHeader(authorizationHeader);

        String transferType = getStringField(body, "transferType");
        if (!"in".equals(transferType)) {
            log.info("Ignore SePay webhook because transferType is not 'in': {}", transferType);
            return Mono.just(Map.of("success", true));
        }

        int donationId = extractDonationIdFromContent(body);
        return fundDonationsRepository.findById(donationId)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.RESOURCES_NOT_FOUND,
                        "Fund donation not found with id: " + donationId
                )))
                .flatMap(existing -> {
                    if (existing.getStatus() == FundDonationStatus.SUCCESS) {
                        log.info("Donation already SUCCESS, skip update. donationId={}", donationId);
                        return Mono.just(existing);
                    }
                    existing.setStatus(FundDonationStatus.SUCCESS);
                    return fundDonationsRepository.save(existing);
                })
                .thenReturn(Map.of("success", true));
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
        if (!sepayApiKey.equals(incomingApiKey)) {
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
}
