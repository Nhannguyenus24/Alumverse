package com.service.backend.fundraising.service;

import com.service.backend.fundraising.dao.*;
import com.service.backend.fundraising.dto.*;
import com.service.backend.shared.entity.*;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
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
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FundService Unit Tests")
class FundServiceTest {

    @Mock private FundR2dbcRepository fundR2dbcRepository;
    @Mock private OrganizationR2dbcRepository organizationRepository;
    @Mock private FundReceivingInfosR2dbcRepository fundReceivingInfosRepository;
    @Mock private FundDonationsR2dbcRepository fundDonationsRepository;
    @Mock private UserR2dbcRepository userRepository;
    @Mock private CacheUtils cacheUtils;
    @Mock private ImageService imageService;

    private FundService fundService;

    @BeforeEach
    void setUp() {
        fundService = new FundService(
                fundR2dbcRepository, organizationRepository, fundReceivingInfosRepository,
                fundDonationsRepository, userRepository, cacheUtils, imageService
        );
        // Set @Value fields
        ReflectionTestUtils.setField(fundService, "sepayQrImgUrl", "https://img.vietqr.io/image/");
        ReflectionTestUtils.setField(fundService, "vietQrTemplate", "compact2");
    }

    // ─── getFundDetail ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getFundDetail()")
    class GetFundDetail {

        @Test
        @DisplayName("should return fund detail when found")
        void getFundDetail_success() {
            Funds fund = Funds.builder()
                    .id(1)
                    .name("Test Fund")
                    .organizationId(1)
                    .fundReceivingInfoId(null)
                    .currentAmount(BigDecimal.ZERO)
                    .managerEmail("manager@test.com")
                    .build();

            Organization org = Organization.builder()
                    .id(1)
                    .name("Test Org")
                    .build();

            when(fundR2dbcRepository.findById(1L)).thenReturn(Mono.just(fund));
            when(organizationRepository.findById(1)).thenReturn(Mono.just(org));
            when(userRepository.findByEmail("manager@test.com")).thenReturn(Mono.empty());

            StepVerifier.create(fundService.getFundDetail(1L))
                    .assertNext(res -> assertThat(res.getName()).isEqualTo("Test Fund"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when fund not found")
        void getFundDetail_notFound() {
            when(fundR2dbcRepository.findById(99L)).thenReturn(Mono.empty());

            StepVerifier.create(fundService.getFundDetail(99L))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FUND_NOT_FOUND)
                    .verify();
        }
    }

    // ─── closeFund ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("closeFund()")
    class CloseFund {

        @Test
        @DisplayName("should close fund successfully")
        void closeFund_success() {
            Funds fund = Funds.builder()
                    .id(1)
                    .name("Active Fund")
                    .timeStarted(LocalDateTime.now().minusDays(5))
                    .timeEnded(LocalDateTime.now().plusDays(5))
                    .build();

            Funds closedFund = Funds.builder()
                    .id(1)
                    .name("Active Fund")
                    .timeStarted(LocalDateTime.now().minusDays(5))
                    .timeEnded(LocalDateTime.now())
                    .build();

            when(fundR2dbcRepository.findById(1L)).thenReturn(Mono.just(fund));
            when(fundR2dbcRepository.save(any())).thenReturn(Mono.just(closedFund));

            StepVerifier.create(fundService.closeFund(1L))
                    .assertNext(f -> assertThat(f.getId()).isEqualTo(1L))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when fund not found")
        void closeFund_notFound() {
            when(fundR2dbcRepository.findById(99L)).thenReturn(Mono.empty());

            StepVerifier.create(fundService.closeFund(99L))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FUND_NOT_FOUND)
                    .verify();
        }
    }

    // ─── createFundDonation ───────────────────────────────────────────────────

    @Nested
    @DisplayName("createFundDonation()")
    class CreateFundDonation {

        @Test
        @DisplayName("should create donation for anonymous donor (no memberId)")
        void createFundDonation_anonymousDonor() {
            CreateFundDonationRequest request = CreateFundDonationRequest.builder()
                    .fundId(1)
                    .donorMemberId(null)
                    .donorName("Anonymous")
                    .amount(new BigDecimal("100000"))
                    .message("Good luck!")
                    .build();

            FundDonations savedDonation = FundDonations.builder()
                    .id(1)
                    .fundId(1)
                    .donorName("Anonymous")
                    .amount(new BigDecimal("100000"))
                    .status(Status.PENDING)
                    .build();

            when(fundDonationsRepository.save(any())).thenReturn(Mono.just(savedDonation));

            StepVerifier.create(fundService.createFundDonation(request))
                    .assertNext(d -> {
                        assertThat(d.getDonorName()).isEqualTo("Anonymous");
                        assertThat(d.getStatus()).isEqualTo(Status.PENDING);
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should create donation for authenticated donor")
        void createFundDonation_authenticatedDonor() {
            User user = User.builder().id(5).build();

            CreateFundDonationRequest request = CreateFundDonationRequest.builder()
                    .fundId(1)
                    .donorMemberId(5)
                    .donorName("Alice")
                    .amount(new BigDecimal("500000"))
                    .build();

            FundDonations savedDonation = FundDonations.builder()
                    .id(2)
                    .fundId(1)
                    .donorMemberId(5)
                    .donorName("Alice")
                    .amount(new BigDecimal("500000"))
                    .status(Status.PENDING)
                    .build();

            when(userRepository.findById(5)).thenReturn(Mono.just(user));
            when(fundDonationsRepository.save(any())).thenReturn(Mono.just(savedDonation));

            StepVerifier.create(fundService.createFundDonation(request))
                    .assertNext(d -> {
                        assertThat(d.getDonorName()).isEqualTo("Alice");
                        assertThat(d.getDonorMemberId()).isEqualTo(5);
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when donor member not found")
        void createFundDonation_donorNotFound() {
            CreateFundDonationRequest request = CreateFundDonationRequest.builder()
                    .fundId(1)
                    .donorMemberId(99)
                    .amount(new BigDecimal("100000"))
                    .build();

            when(userRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(fundService.createFundDonation(request))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.USER_NOT_FOUND)
                    .verify();
        }
    }

    // ─── createFundReceivingInfos ─────────────────────────────────────────────

    @Nested
    @DisplayName("createFundReceivingInfos()")
    class CreateFundReceivingInfos {

        @Test
        @DisplayName("should fail when bank code is blank")
        void createFundReceivingInfos_blankBankCode() {
            CreateFundReceivingInfosRequest request = new CreateFundReceivingInfosRequest();
            request.setBankName("");
            request.setAccountNumber("123456789");
            request.setAccountName("Test Account");

            StepVerifier.create(fundService.createFundReceivingInfos(request))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.RESOURCES_NOT_FOUND)
                    .verify();
        }
    }
}
