package com.service.backend.fundraising.service;

import com.service.backend.fundraising.dao.*;
import com.service.backend.fundraising.dto.*;
import com.service.backend.organization.dao.OrganizationRepository;
import com.service.backend.user.dao.UserProfileRepository;
import com.service.backend.shared.entity.*;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.service.FileUploadService;
import com.service.backend.shared.utils.CacheUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FundService Unit Tests")
class FundServiceTest {

    @Mock private FundR2dbcRepository fundR2dbcRepository;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private FundReceivingInfosR2dbcRepository fundReceivingInfosRepository;
    @Mock private FundDonationsR2dbcRepository fundDonationsRepository;
    @Mock private UserProfileRepository userRepository;
    @Mock private CacheUtils cacheUtils;
    @Mock private ImageService imageService;
    @Mock private FileUploadService fileUploadService;

    private FundService fundService;

    @BeforeEach
    void setUp() {
        fundService = new FundService(
                fundR2dbcRepository, organizationRepository, fundReceivingInfosRepository,
                fundDonationsRepository, userRepository, cacheUtils, imageService, fileUploadService
        );
        // Set @Value fields
        ReflectionTestUtils.setField(fundService, "sepayQrImgUrl", "https://img.vietqr.io/image/");
        ReflectionTestUtils.setField(fundService, "vietQrTemplate", "compact2");
        // createFund/closeFund now evict the fund-statistics cache; stub so reactive chains complete.
        lenient().when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());
    }

    private static Context staffContext(Integer organizationId) {
        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                "1", null, List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
        token.setDetails(organizationId);
        return ReactiveSecurityContextHolder.withAuthentication(token);
    }

    private static Context adminContext(Integer organizationId) {
        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                "1", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        token.setDetails(organizationId);
        return ReactiveSecurityContextHolder.withAuthentication(token);
    }

    private static Context userContext(Integer userId) {
        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                String.valueOf(userId), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        return ReactiveSecurityContextHolder.withAuthentication(token);
    }

    @Test
    @DisplayName("puts the donation marker first in the QR transfer description")
    void buildDescription_keepsDonationMarkerBeforeOptionalMessage() {
        String description = ReflectionTestUtils.invokeMethod(
                fundService, "buildDescription", "Quỹ rất có ý nghĩa hãy cố gắng phát huy", 123);

        assertThat(description).isEqualTo("FD123 Quỹ rất có ý nghĩa hãy cố gắng phát huy");
    }

    // ─── getFundDetail ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getFundsForList()")
    class GetFundsForList {

        @Test
        @DisplayName("returns a stable featured fund separately and paginates the remaining funds")
        void getFundsForList_excludesFeaturedFromPageAndCount() {
            Funds featured = Funds.builder().id(1).name("Featured").organizationId(4).build();
            Funds firstItem = Funds.builder().id(12).name("Page item 1").organizationId(4).build();
            Funds secondItem = Funds.builder().id(11).name("Page item 2").organizationId(4).build();
            FundFilterRequest request = FundFilterRequest.builder()
                    .page(1)
                    .size(9)
                    .organizationId("4")
                    .q("  scholarship  ")
                    .build();

            when(fundR2dbcRepository.findFeaturedFiltered(
                    eq(4), eq("scholarship"), isNull(), isNull(), isNull(), isNull()))
                    .thenReturn(Mono.just(featured));
            when(fundR2dbcRepository.findFiltered(
                    eq(4), eq("scholarship"), isNull(), isNull(), isNull(), isNull(),
                    eq(1), eq(9), eq(9)))
                    .thenReturn(Flux.just(firstItem, secondItem));
            when(fundR2dbcRepository.countFiltered(
                    eq(4), eq("scholarship"), isNull(), isNull(), isNull(), isNull(), eq(1)))
                    .thenReturn(Mono.just(18L));

            StepVerifier.create(fundService.getFundsForList(request))
                    .assertNext(result -> {
                        assertThat(result.getWarnings()).isEmpty();
                        assertThat(result.getData().getFeatured().getId()).isEqualTo(1);
                        assertThat(result.getData().getItems())
                                .extracting(FundListItemResponse::getId)
                                .containsExactly(12, 11);
                        assertThat(result.getData().getCurrentPage()).isEqualTo(1);
                        assertThat(result.getData().getPageSize()).isEqualTo(9);
                        assertThat(result.getData().getTotalItem()).isEqualTo(18L);
                        assertThat(result.getData().getTotalPage()).isEqualTo(2);
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("returns an empty featured value when no fund matches")
        void getFundsForList_noMatchingFunds() {
            FundFilterRequest request = FundFilterRequest.builder().page(0).size(9).build();

            when(fundR2dbcRepository.findFeaturedFiltered(
                    isNull(), isNull(), isNull(), isNull(), isNull(), isNull()))
                    .thenReturn(Mono.empty());
            when(fundR2dbcRepository.findFiltered(
                    isNull(), isNull(), isNull(), isNull(), isNull(), isNull(),
                    isNull(), eq(9), eq(0)))
                    .thenReturn(Flux.empty());
            when(fundR2dbcRepository.countFiltered(
                    isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull()))
                    .thenReturn(Mono.just(0L));

            StepVerifier.create(fundService.getFundsForList(request))
                    .assertNext(result -> {
                        assertThat(result.getData().getFeatured()).isNull();
                        assertThat(result.getData().getItems()).isEmpty();
                        assertThat(result.getData().getTotalItem()).isZero();
                        assertThat(result.getData().getTotalPage()).isZero();
                    })
                    .verifyComplete();
        }
    }

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

    // ─── updateFundBasicInfo ─────────────────────────────────────────────────

    @Nested
    @DisplayName("updateFundBasicInfo()")
    class UpdateFundBasicInfo {

        private UpdateFundBasicInfoRequest basicInfoRequest() {
            return UpdateFundBasicInfoRequest.builder()
                    .managerName("Updated Manager Name")
                    .managerEmail("updated@test.com")
                    .descriptionFull("Updated description")
                    .build();
        }

        private Funds activeFund(Integer organizationId) {
            return Funds.builder()
                    .id(1)
                    .name("Original Name")
                    .organizationId(organizationId)
                    .managerName("Manager")
                    .managerEmail("original@test.com")
                    .descriptionShort("short")
                    .descriptionFull("Original description")
                    .targetAmount(new BigDecimal("1000000"))
                    .timeStarted(LocalDateTime.now().minusDays(1))
                    .timeEnded(LocalDateTime.now().plusDays(5))
                    .build();
        }

        private Funds endedFund(Integer organizationId) {
            return Funds.builder()
                    .id(1)
                    .name("Original Name")
                    .organizationId(organizationId)
                    .managerEmail("original@test.com")
                    .descriptionFull("Original description")
                    .timeStarted(LocalDateTime.now().minusDays(10))
                    .timeEnded(LocalDateTime.now().minusDays(1))
                    .build();
        }

        @Test
        @DisplayName("STAFF in same org: updates only managerName/managerEmail/descriptionFull")
        void updateFundBasicInfo_staffSameOrg_updatesOnlyThreeFields() {
            Funds existing = activeFund(10);
            when(fundR2dbcRepository.findById(1L)).thenReturn(Mono.just(existing));
            when(fundR2dbcRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

            StepVerifier.create(fundService.updateFundBasicInfo(1L, basicInfoRequest())
                            .contextWrite(staffContext(10)))
                    .assertNext(saved -> {
                        assertThat(saved.getManagerName()).isEqualTo("Updated Manager Name");
                        assertThat(saved.getManagerEmail()).isEqualTo("updated@test.com");
                        assertThat(saved.getDescriptionFull()).isEqualTo("Updated description");
                        assertThat(saved.getName()).isEqualTo("Original Name");
                        assertThat(saved.getDescriptionShort()).isEqualTo("short");
                        assertThat(saved.getTargetAmount()).isEqualByComparingTo("1000000");
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("STAFF basic-info: does NOT change fundDocumentUrl (not bindable in this DTO)")
        void updateFundBasicInfo_staffSameOrg_leavesDocumentUrlUnchanged() {
            Funds existing = activeFund(10);
            existing.setFundDocumentUrl("https://example.com/funds/original-doc.pdf");
            when(fundR2dbcRepository.findById(1L)).thenReturn(Mono.just(existing));
            when(fundR2dbcRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

            StepVerifier.create(fundService.updateFundBasicInfo(1L, basicInfoRequest())
                            .contextWrite(staffContext(10)))
                    .assertNext(saved -> {
                        assertThat(saved.getDescriptionFull()).isEqualTo("Updated description");
                        assertThat(saved.getFundDocumentUrl())
                                .isEqualTo("https://example.com/funds/original-doc.pdf");
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("STAFF in different org: forbidden")
        void updateFundBasicInfo_staffDifferentOrg_forbidden() {
            Funds existing = activeFund(10);
            when(fundR2dbcRepository.findById(1L)).thenReturn(Mono.just(existing));

            StepVerifier.create(fundService.updateFundBasicInfo(1L, basicInfoRequest())
                            .contextWrite(staffContext(20)))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FORBIDDEN)
                    .verify();
        }

        @Test
        @DisplayName("STAFF with null org: forbidden (fail-safe)")
        void updateFundBasicInfo_staffNullOrg_forbidden() {
            Funds existing = activeFund(10);
            when(fundR2dbcRepository.findById(1L)).thenReturn(Mono.just(existing));

            StepVerifier.create(fundService.updateFundBasicInfo(1L, basicInfoRequest())
                            .contextWrite(staffContext(null)))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FORBIDDEN)
                    .verify();
        }

        @Test
        @DisplayName("ADMIN with null org: not subject to org check")
        void updateFundBasicInfo_adminNullOrg_succeeds() {
            Funds existing = activeFund(10);
            when(fundR2dbcRepository.findById(1L)).thenReturn(Mono.just(existing));
            when(fundR2dbcRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

            StepVerifier.create(fundService.updateFundBasicInfo(1L, basicInfoRequest())
                            .contextWrite(adminContext(null)))
                    .assertNext(saved -> assertThat(saved.getManagerName()).isEqualTo("Updated Manager Name"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("STAFF on ended fund: FUND_ALREADY_ENDED")
        void updateFundBasicInfo_staffEndedFund_alreadyEnded() {
            Funds existing = endedFund(10);
            when(fundR2dbcRepository.findById(1L)).thenReturn(Mono.just(existing));

            StepVerifier.create(fundService.updateFundBasicInfo(1L, basicInfoRequest())
                            .contextWrite(staffContext(10)))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FUND_ALREADY_ENDED)
                    .verify();
        }

        @Test
        @DisplayName("ADMIN on ended fund: FUND_ALREADY_ENDED")
        void updateFundBasicInfo_adminEndedFund_alreadyEnded() {
            Funds existing = endedFund(10);
            when(fundR2dbcRepository.findById(1L)).thenReturn(Mono.just(existing));

            StepVerifier.create(fundService.updateFundBasicInfo(1L, basicInfoRequest())
                            .contextWrite(adminContext(10)))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FUND_ALREADY_ENDED)
                    .verify();
        }

        @Test
        @DisplayName("should fail when fund not found")
        void updateFundBasicInfo_notFound() {
            when(fundR2dbcRepository.findById(99L)).thenReturn(Mono.empty());

            StepVerifier.create(fundService.updateFundBasicInfo(99L, basicInfoRequest())
                            .contextWrite(adminContext(null)))
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
                    .donorMemberId(99)
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

            when(userRepository.existsById(5)).thenReturn(Mono.just(true));
            when(fundDonationsRepository.save(any())).thenReturn(Mono.just(savedDonation));

            StepVerifier.create(fundService.createFundDonation(request).contextWrite(userContext(5)))
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
                    .donorMemberId(5)
                    .amount(new BigDecimal("100000"))
                    .build();

            when(userRepository.existsById(99)).thenReturn(Mono.just(false));

            StepVerifier.create(fundService.createFundDonation(request).contextWrite(userContext(99)))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.USER_NOT_FOUND)
                    .verify();
        }
    }

    // ─── createFund (fundDocumentUrl) ─────────────────────────────────────────

    @Nested
    @DisplayName("createFund() — fundDocumentUrl")
    class CreateFund {

        private CreateFundRequest baseRequest() {
            return CreateFundRequest.builder()
                    .name("New Fund")
                    .descriptionShort("short")
                    .descriptionFull("full")
                    .managerName("Manager")
                    .managerEmail("manager@test.com")
                    .organizationId(1)
                    .fundReceivingInfoId(1)
                    .targetAmount(new BigDecimal("1000000"))
                    .timeStarted(LocalDateTime.now().plusDays(1))
                    .timeEnded(LocalDateTime.now().plusDays(10))
                    .build();
        }

        private void stubDependencies() {
            when(organizationRepository.findById(1)).thenReturn(Mono.just(Organization.builder().id(1).build()));
            when(fundReceivingInfosRepository.findById(1))
                    .thenReturn(Mono.just(FundReceivingInfos.builder().id(1).build()));
            when(imageService.uploadBase64IfPresent(any())).thenReturn(Mono.empty());
            when(fundR2dbcRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));
        }

        @Test
        @DisplayName("stores the uploaded document when base64 is provided")
        void createFund_withDocument_stored() {
            stubDependencies();
            when(fileUploadService.uploadBase64File(any(), any()))
                    .thenReturn(Mono.just("https://example.com/funds/decision.pdf"));
            CreateFundRequest request = baseRequest();
            request.setFundDocumentBase64("ZG9jdW1lbnQ=");
            request.setFundDocumentFileName("decision.pdf");

            StepVerifier.create(fundService.createFund(request))
                    .assertNext(saved -> assertThat(saved.getFundDocumentUrl())
                            .isEqualTo("https://example.com/funds/decision.pdf"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("leaves fundDocumentUrl null when no document is provided (optional)")
        void createFund_withoutDocument_null() {
            stubDependencies();

            StepVerifier.create(fundService.createFund(baseRequest()))
                    .assertNext(saved -> assertThat(saved.getFundDocumentUrl()).isNull())
                    .verifyComplete();
        }

        @Test
        @DisplayName("normalizes blank document base64 to null")
        void createFund_blankDocument_null() {
            stubDependencies();
            CreateFundRequest request = baseRequest();
            request.setFundDocumentBase64("   ");

            StepVerifier.create(fundService.createFund(request))
                    .assertNext(saved -> assertThat(saved.getFundDocumentUrl()).isNull())
                    .verifyComplete();
        }
    }

    // ─── updateFund (fundDocumentUrl) ─────────────────────────────────────────

    @Nested
    @DisplayName("updateFund() — fundDocumentUrl")
    class UpdateFund {

        private Funds editableFund() {
            return Funds.builder()
                    .id(1)
                    .name("Original")
                    .organizationId(1)
                    .fundReceivingInfoId(1)
                    .managerName("Manager")
                    .managerEmail("original@test.com")
                    .descriptionShort("short")
                    .descriptionFull("full")
                    .targetAmount(new BigDecimal("1000000"))
                    .fundDocumentUrl("https://example.com/funds/original-doc.pdf")
                    .timeStarted(LocalDateTime.now().plusDays(1))
                    .timeEnded(LocalDateTime.now().plusDays(10))
                    .build();
        }

        private UpdateFundRequest.UpdateFundRequestBuilder baseRequestBuilder(Funds existing) {
            return UpdateFundRequest.builder()
                    .name("Updated")
                    .descriptionShort("short")
                    .descriptionFull("full")
                    .managerName("Manager")
                    .managerEmail("manager@test.com")
                    .targetAmount(existing.getTargetAmount())
                    .fundReceivingInfoId(existing.getFundReceivingInfoId())
                    .timeStarted(existing.getTimeStarted())
                    .timeEnded(existing.getTimeEnded());
        }

        private void stubForUpdate(Funds existing) {
            when(fundR2dbcRepository.findById(1L)).thenReturn(Mono.just(existing));
            when(fundReceivingInfosRepository.findById(1))
                    .thenReturn(Mono.just(FundReceivingInfos.builder().id(1).build()));
            when(fundR2dbcRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));
            // No logo base64 in these document-focused tests → keep existing logo.
            when(imageService.uploadBase64IfPresent(any())).thenReturn(Mono.empty());
        }

        @Test
        @DisplayName("replaces the document when a new base64 file is provided")
        void updateFund_changesDocument() {
            Funds existing = editableFund();
            stubForUpdate(existing);
            when(fileUploadService.uploadBase64File(any(), any()))
                    .thenReturn(Mono.just("https://example.com/funds/new-doc.pdf"));
            UpdateFundRequest request = baseRequestBuilder(existing)
                    .fundDocumentBase64("ZG9jdW1lbnQ=")
                    .fundDocumentFileName("new-doc.pdf")
                    .build();

            StepVerifier.create(fundService.updateFund(1L, request))
                    .assertNext(saved -> assertThat(saved.getFundDocumentUrl())
                            .isEqualTo("https://example.com/funds/new-doc.pdf"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("removeFundDocument removes the current document")
        void updateFund_removeDocument() {
            Funds existing = editableFund();
            stubForUpdate(existing);
            UpdateFundRequest request = baseRequestBuilder(existing)
                    .removeFundDocument(true)
                    .build();

            StepVerifier.create(fundService.updateFund(1L, request))
                    .assertNext(saved -> assertThat(saved.getFundDocumentUrl()).isNull())
                    .verifyComplete();
        }

        @Test
        @DisplayName("keeps the existing document when nothing is provided (no accidental wipe)")
        void updateFund_nullKeepsDocument() {
            Funds existing = editableFund();
            stubForUpdate(existing);
            UpdateFundRequest request = baseRequestBuilder(existing).build();

            StepVerifier.create(fundService.updateFund(1L, request))
                    .assertNext(saved -> assertThat(saved.getFundDocumentUrl())
                            .isEqualTo("https://example.com/funds/original-doc.pdf"))
                    .verifyComplete();
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
