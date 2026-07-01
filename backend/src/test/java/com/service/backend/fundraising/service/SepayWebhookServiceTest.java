package com.service.backend.fundraising.service;

import com.service.backend.fundraising.dao.FundDonationsR2dbcRepository;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
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

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SepayWebhookService Unit Tests")
class SepayWebhookServiceTest {

    @Mock private FundDonationsR2dbcRepository fundDonationsRepository;

    private SepayWebhookService sepayWebhookService;

    @BeforeEach
    void setUp() {
        sepayWebhookService = new SepayWebhookService(fundDonationsRepository);
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
            Map<String, Object> body = new HashMap<>();
            body.put("transferType", "in");
            body.put("content", "Payment FD42 confirmed");

            when(fundDonationsRepository.findById(42)).thenReturn(
                    Mono.just(com.service.backend.shared.entity.FundDonations.builder()
                            .id(42)
                            .status(com.service.backend.shared.enums.Status.PENDING)
                            .build())
            );
            when(fundDonationsRepository.save(any())).thenReturn(
                    Mono.just(com.service.backend.shared.entity.FundDonations.builder()
                            .id(42)
                            .status(com.service.backend.shared.enums.Status.SUCCESS)
                            .build())
            );

            StepVerifier.create(sepayWebhookService.processWebhook("Apikey test-api-key", body))
                    .assertNext(result -> assertThat(result.get("success")).isTrue())
                    .verifyComplete();
        }
    }
}
