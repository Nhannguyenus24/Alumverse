package com.service.backend.fundraising.service;

import com.service.backend.fundraising.dao.FundDonationsR2dbcRepository;
import com.service.backend.fundraising.dao.FundR2dbcRepository;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.CacheUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SepayWebhookService Unit Tests")
class SepayWebhookServiceTest {

    @Mock private FundDonationsR2dbcRepository fundDonationsRepository;
    @Mock private FundR2dbcRepository fundRepository;
    @Mock private CacheUtils cacheUtils;

    private SepayWebhookService sepayWebhookService;

    @BeforeEach
    void setUp() {
        sepayWebhookService = new SepayWebhookService(fundDonationsRepository, fundRepository, cacheUtils);
        ReflectionTestUtils.setField(sepayWebhookService, "sepayApiKey", "test-api-key");
    }

    // ─── processWebhook ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("processWebhook()")
    class ProcessWebhook {

        @Test
        @DisplayName("should fail with invalid authorization header")
        void processWebhook_invalidAuth() {
            Map<String, Object> body = new HashMap<>();
            body.put("content", "Payment received FD123");

            org.junit.jupiter.api.Assertions.assertThrows(ApplicationException.class, () -> 
                    sepayWebhookService.processWebhook("Apikey wrong-key", body));
        }

        @Test
        @DisplayName("should fail when authorization header is missing Apikey prefix")
        void processWebhook_invalidAuthPrefix() {
            Map<String, Object> body = new HashMap<>();
            body.put("content", "Payment received FD123");

            org.junit.jupiter.api.Assertions.assertThrows(ApplicationException.class, () -> 
                    sepayWebhookService.processWebhook("Bearer test-api-key", body));
        }

        @Test
        @DisplayName("should ignore webhook when transferType is not 'in'")
        void processWebhook_notInTransferType() {
            Map<String, Object> body = new HashMap<>();
            body.put("transferType", "out");

            StepVerifier.create(sepayWebhookService.processWebhook("Apikey test-api-key", body))
                    .assertNext(result -> assertThat(result.get("success")).isTrue())
                    .verifyComplete();
        }

        @Test
        @DisplayName("should process webhook successfully with valid data")
        void processWebhook_success() {
            Map<String, Object> body = validWebhook(72542821L);

            when(fundDonationsRepository.findById(42)).thenReturn(
                    Mono.just(com.service.backend.shared.entity.FundDonations.builder()
                            .id(42)
                            .fundId(7)
                            .status(com.service.backend.shared.enums.Status.PENDING)
                            .build())
            );
            when(fundRepository.findReceivingInfoLookupByFundId(7L)).thenReturn(Mono.just(
                    com.service.backend.fundraising.dto.FundReceivingInfoLookup.builder()
                            .riAccountNumber("0917669258")
                            .build()));
            when(fundDonationsRepository.claimPendingDonation(
                    42, 72542821L, new BigDecimal("2000"))).thenReturn(
                    Mono.just(com.service.backend.shared.entity.FundDonations.builder()
                            .id(42)
                            .fundId(7)
                            .amount(new BigDecimal("2000"))
                            .status(com.service.backend.shared.enums.Status.SUCCESS)
                            .sepayTransactionId(72542821L)
                            .build())
            );
            when(fundRepository.incrementDonorCountAndAmount(7, new BigDecimal("2000")))
                    .thenReturn(Mono.just(1));
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(sepayWebhookService.processWebhook("Apikey test-api-key", body))
                    .assertNext(result -> assertThat(result.get("success")).isTrue())
                    .verifyComplete();

            // Marking the donation SUCCESS must invalidate the fund-statistics cache.
            verify(cacheUtils).clear(com.service.backend.shared.utils.CacheNames.FUND_STATISTICS);
            verify(fundDonationsRepository).claimPendingDonation(
                    42, 72542821L, new BigDecimal("2000"));
            verify(fundDonationsRepository, never()).insertAdditionalDonation(anyInt(), anyLong(), any());
        }

        @Test
        @DisplayName("should create another donation for a second transfer using the same QR")
        void processWebhook_secondTransferCreatesDonation() {
            Map<String, Object> body = validWebhook(72542822L);
            com.service.backend.shared.entity.FundDonations source =
                    com.service.backend.shared.entity.FundDonations.builder()
                            .id(42)
                            .fundId(7)
                            .status(com.service.backend.shared.enums.Status.SUCCESS)
                            .sepayTransactionId(72542821L)
                            .build();
            com.service.backend.shared.entity.FundDonations additional =
                    com.service.backend.shared.entity.FundDonations.builder()
                            .id(43)
                            .fundId(7)
                            .amount(new BigDecimal("2000"))
                            .status(com.service.backend.shared.enums.Status.SUCCESS)
                            .sepayTransactionId(72542822L)
                            .build();

            when(fundDonationsRepository.findById(42)).thenReturn(Mono.just(source));
            when(fundRepository.findReceivingInfoLookupByFundId(7L)).thenReturn(Mono.just(
                    com.service.backend.fundraising.dto.FundReceivingInfoLookup.builder()
                            .riAccountNumber("0917669258")
                            .build()));
            when(fundDonationsRepository.claimPendingDonation(
                    42, 72542822L, new BigDecimal("2000"))).thenReturn(Mono.empty());
            when(fundDonationsRepository.insertAdditionalDonation(
                    42, 72542822L, new BigDecimal("2000"))).thenReturn(Mono.just(additional));
            when(fundRepository.incrementDonorCountAndAmount(7, new BigDecimal("2000")))
                    .thenReturn(Mono.just(1));
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(sepayWebhookService.processWebhook("Apikey test-api-key", body))
                    .assertNext(result -> assertThat(result.get("success")).isTrue())
                    .verifyComplete();

            verify(fundDonationsRepository).insertAdditionalDonation(
                    42, 72542822L, new BigDecimal("2000"));
            verify(fundRepository).incrementDonorCountAndAmount(7, new BigDecimal("2000"));
        }

        @Test
        @DisplayName("should not increment the fund when SePay retries the same transaction")
        void processWebhook_duplicateTransactionIsIgnored() {
            Map<String, Object> body = validWebhook(72542821L);
            when(fundDonationsRepository.findById(42)).thenReturn(Mono.just(
                    com.service.backend.shared.entity.FundDonations.builder()
                            .id(42)
                            .fundId(7)
                            .status(com.service.backend.shared.enums.Status.SUCCESS)
                            .sepayTransactionId(72542821L)
                            .build()));
            when(fundRepository.findReceivingInfoLookupByFundId(7L)).thenReturn(Mono.just(
                    com.service.backend.fundraising.dto.FundReceivingInfoLookup.builder()
                            .riAccountNumber("0917669258")
                            .build()));
            when(fundDonationsRepository.claimPendingDonation(
                    42, 72542821L, new BigDecimal("2000"))).thenReturn(Mono.empty());
            when(fundDonationsRepository.insertAdditionalDonation(
                    42, 72542821L, new BigDecimal("2000"))).thenReturn(Mono.empty());

            StepVerifier.create(sepayWebhookService.processWebhook("Apikey test-api-key", body))
                    .assertNext(result -> assertThat(result.get("success")).isTrue())
                    .verifyComplete();

            verify(fundRepository, never()).incrementDonorCountAndAmount(any(), any());
            verify(cacheUtils, never()).clear(anyString());
        }

        @Test
        @DisplayName("should acknowledge but ignore a transfer sent to another account")
        void processWebhook_wrongReceivingAccountIsIgnored() {
            Map<String, Object> body = validWebhook(72542821L);
            when(fundDonationsRepository.findById(42)).thenReturn(Mono.just(
                    com.service.backend.shared.entity.FundDonations.builder()
                            .id(42)
                            .fundId(7)
                            .status(com.service.backend.shared.enums.Status.PENDING)
                            .build()));
            when(fundRepository.findReceivingInfoLookupByFundId(7L)).thenReturn(Mono.just(
                    com.service.backend.fundraising.dto.FundReceivingInfoLookup.builder()
                            .riAccountNumber("0000000000")
                            .build()));

            StepVerifier.create(sepayWebhookService.processWebhook("Apikey test-api-key", body))
                    .assertNext(result -> assertThat(result.get("success")).isTrue())
                    .verifyComplete();

            verify(fundDonationsRepository, never()).claimPendingDonation(anyInt(), anyLong(), any());
            verify(fundDonationsRepository, never()).insertAdditionalDonation(anyInt(), anyLong(), any());
            verify(fundRepository, never()).incrementDonorCountAndAmount(any(), any());
        }

        private Map<String, Object> validWebhook(long transactionId) {
            Map<String, Object> body = new HashMap<>();
            body.put("id", transactionId);
            body.put("transferType", "in");
            body.put("accountNumber", "0917669258");
            body.put("content", "141469805680-FD42-CHUYEN TIEN");
            body.put("transferAmount", 2000);
            return body;
        }
    }
}
