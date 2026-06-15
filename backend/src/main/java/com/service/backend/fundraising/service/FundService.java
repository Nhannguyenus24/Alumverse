package com.service.backend.fundraising.service;

import com.service.backend.shared.entity.*;
import org.springframework.transaction.annotation.Transactional;
import com.service.backend.fundraising.dao.UserR2dbcRepository;
import com.service.backend.fundraising.dao.FundR2dbcRepository;
import com.service.backend.fundraising.dao.FundReceivingInfosR2dbcRepository;
import com.service.backend.fundraising.dao.FundStatusR2dbcRepository;
import com.service.backend.fundraising.dao.OrganizationR2dbcRepository;
import com.service.backend.fundraising.dao.FundDonationsR2dbcRepository;
import com.service.backend.fundraising.dto.CreateFundRequest;
import com.service.backend.fundraising.dto.CreateFundReceivingInfosRequest;
import com.service.backend.fundraising.dto.CreateFundDonationRequest;
import com.service.backend.fundraising.dto.FundDetailResponse;
import com.service.backend.fundraising.dto.FundDonationCheckoutResponse;
import com.service.backend.fundraising.dto.FundDonationListItemResponse;
import com.service.backend.fundraising.dto.FundListItemResponse;
import com.service.backend.fundraising.dto.FundStatisticsResponse;
import com.service.backend.fundraising.dto.FundFilterRequest;
import com.service.backend.fundraising.dto.UpdateFundRequest;
import com.service.backend.fundraising.dto.BanksPayloadDto;
import com.service.backend.fundraising.dto.BankInfoDto;
import com.service.backend.fundraising.dto.SupportedBanksResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.shared.utils.JsonUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import com.service.backend.shared.dto.DataWithWarnings;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class FundService {

    private final FundR2dbcRepository fundR2dbcRepository;
    private final OrganizationR2dbcRepository organizationRepository;
    private final FundReceivingInfosR2dbcRepository fundReceivingInfosRepository;
    private final FundStatusR2dbcRepository fundStatusRepository;
    private final FundDonationsR2dbcRepository fundDonationsRepository;
    private final UserR2dbcRepository userRepository;
    private final CacheUtils cacheUtils;
    private final ImageService imageService;

    @Value("${sepay.img.qr.url}")
    private String sepayQrImgUrl;

    public Mono<Funds> createFund(CreateFundRequest request) {
        Integer organizationId = request.getOrganizationId();
        Integer fundReceivingInfoId = request.getFundReceivingInfoId();
        Integer statusId = request.getStatusId();

        return organizationRepository.findById(organizationId)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.FUND_NOT_FOUND,
                        "Organization not found with id: " + organizationId)))
                .flatMap(existingOrganization -> fundReceivingInfosRepository.findById(fundReceivingInfoId)
                        .switchIfEmpty(Mono.error(new ApplicationException(
                                ErrorCode.FUND_NOT_FOUND,
                                "Fund receiving info not found with id: " + fundReceivingInfoId)))
                        .flatMap(existingFundReceivingInfo -> fundStatusRepository.findById(statusId)
                                .switchIfEmpty(Mono.error(new ApplicationException(
                                        ErrorCode.FUND_NOT_FOUND,
                                        "Fund status not found with id: " + statusId)))
                                .flatMap(existingStatus -> imageService.uploadBase64IfPresent(request.getLogoBase64())
                                        .defaultIfEmpty(request.getLogoUrl() == null ? "" : request.getLogoUrl())
                                        .flatMap(logoUrl -> {
                                            Funds fund = Funds.builder()
                                                    .organizationId(organizationId)
                                                    .fundReceivingInfoId(fundReceivingInfoId)
                                                    .name(request.getName())
                                                    .logoUrl(logoUrl.isEmpty() ? null : logoUrl)
                                                    .descriptionShort(request.getDescriptionShort())
                                                    .descriptionFull(request.getDescriptionFull())
                                                    .managerName(request.getManagerName())
                                                    .targetAmount(request.getTargetAmount())
                                                    .currentAmount(java.math.BigDecimal.ZERO)
                                                    .timeStarted(request.getTimeStarted())
                                                    .statusId(statusId)
                                                    .topic(request.getTopic())
                                                    .timeEnded(request.getTimeEnded())
                                                    .build();

                                            return fundR2dbcRepository.save(fund);
                                        }))));
    }

    public Mono<FundReceivingInfos> createFundReceivingInfos(CreateFundReceivingInfosRequest request) {
        String bankCode = request.getBankName() == null ? "" : request.getBankName().trim();

        return validateSupportedBankCode(bankCode)
                .then(Mono.defer(() -> {
                    FundReceivingInfos fundReceivingInfos = FundReceivingInfos.builder()
                            .accountNumber(request.getAccountNumber().trim())
                            .accountName(request.getAccountName().trim())
                            .bankName(bankCode)
                            .isActive(true)
                            .build();

                    return fundReceivingInfosRepository
                            .existsByBankNameAndAccountNumber(bankCode, request.getAccountNumber().trim())
                            .flatMap(exists -> {
                                if (Boolean.TRUE.equals(exists)) {
                                    return Mono.error(new ApplicationException(
                                            ErrorCode.RESOURCES_DUPLICATE,
                                            "Fund receiving info already exists for bankName + accountNumber"));
                                }
                                return fundReceivingInfosRepository.save(fundReceivingInfos);
                            });
                }));
    }

    public Flux<FundReceivingInfos> getActiveFundReceivingInfos() {
        return fundReceivingInfosRepository.findAll()
                .filter(FundReceivingInfos::isActive);
    }

    public Mono<PaginatedResponse<FundReceivingInfos>> getActiveFundReceivingInfos(int page, int limit, String keyword) {
        int offset = page * limit;
        boolean hasKeyword = keyword != null && !keyword.isBlank();
        String kw = hasKeyword ? keyword.trim() : null;

        Mono<Long> countMono = hasKeyword
                ? fundReceivingInfosRepository.countActiveByKeyword(kw)
                : fundReceivingInfosRepository.countActive();

        Flux<FundReceivingInfos> dataFlux = hasKeyword
                ? fundReceivingInfosRepository.findActivePageByKeyword(kw, limit, offset)
                : fundReceivingInfosRepository.findActivePage(limit, offset);

        return PaginationHelper.paginate(dataFlux, countMono, page, limit);
    }

    public Mono<SupportedBanksResponse> getSupportedBanksResponse() {
        return getSupportedBanks()
                .map(banks -> SupportedBanksResponse.builder()
                        .message("Chỉ các ngân hàng sau được hỗ trợ cho quyên góp qua Sepay.")
                        .banks(banks)
                        .build());
    }

    private Mono<Void> validateSupportedBankCode(String bankCode) {
        if (bankCode.isBlank()) {
            return Mono.error(new ApplicationException(
                    ErrorCode.RESOURCES_NOT_FOUND,
                    "Bank code is required"));
        }

        return getSupportedBanks()
                .flatMap(banks -> banks.stream()
                        .anyMatch(bank -> isBankMatched(bank, bankCode))
                        ? Mono.empty()
                        : Mono.error(new ApplicationException(
                                ErrorCode.RESOURCES_NOT_FOUND,
                                "Bank is not supported: " + bankCode)));
    }

    public Mono<DataWithWarnings<PaginatedResponse<FundListItemResponse>>> getFundsForList(FundFilterRequest req) {
        int page = Math.max(0, req.getPage());
        int limit = Math.max(1, req.getSize());
        int offset = page * limit;

        List<String> warnings = new ArrayList<>();

        // tim theo keyword
        String keyword = null;
        if (req.getQ() != null && !req.getQ().trim().isEmpty()) {
            keyword = req.getQ().trim();
        } else if (req.getQ() != null) {
            warnings.add("Param q ignored: empty");
        }

        // organizationId
        Integer organizationId = null;
        if (req.getOrganizationId() != null) {
            try {
                organizationId = Integer.parseInt(req.getOrganizationId());
            } catch (NumberFormatException ex) {
                warnings.add("Param organizationId ignored: invalid format");
            }
        }

        // statusId
        Integer statusId = null;
        if (req.getStatusId() != null) {
            try {
                statusId = Integer.parseInt(req.getStatusId());
            } catch (NumberFormatException ex) {
                warnings.add("Param statusId ignored: invalid format");
            }
        }

        // tim kiem theo thoi gian
        LocalDateTime tsFrom = null;
        LocalDateTime tsTo = null;
        boolean hasFrom = req.getTimeStartedFrom() != null;
        boolean hasTo = req.getTimeStartedTo() != null;
        if (hasFrom && hasTo) {
            try {
                tsFrom = LocalDateTime.parse(req.getTimeStartedFrom());
                tsTo = LocalDateTime.parse(req.getTimeStartedTo());
            } catch (DateTimeParseException ex) {
                warnings.add("Params timeStartedFrom/timeStartedTo ignored: invalid ISO-8601");
                tsFrom = null;
            }
        } else if (hasFrom || hasTo) {
            warnings.add("Params timeStartedFrom/timeStartedTo ignored: both required");
        }

        // tim kiem theo amount
        BigDecimal amtMin = null;
        BigDecimal amtMax = null;
        boolean hasMin = req.getTargetAmountMin() != null;
        boolean hasMax = req.getTargetAmountMax() != null;
        if (hasMin && hasMax) {
            try {
                amtMin = new BigDecimal(req.getTargetAmountMin());
                amtMax = new BigDecimal(req.getTargetAmountMax());
            } catch (NumberFormatException ex) {
                warnings.add("Params targetAmountMin/targetAmountMax ignored: invalid number");
                amtMin = null;
            }
        } else if (hasMin || hasMax) {
            warnings.add("Params targetAmountMin/targetAmountMax ignored: both required");
        }

        // sort
        boolean sortByDonor = false;
        boolean sortAsc = true;
        if (req.getSortBy() != null) {
            if ("donor_count".equalsIgnoreCase(req.getSortBy())) {
                sortByDonor = true;
                if (req.getDirection() != null) {
                    String dir = req.getDirection().toLowerCase();
                    if ("asc".equals(dir)) sortAsc = true;
                    else if ("desc".equals(dir)) sortAsc = false;
                    else {
                        warnings.add("Param direction ignored: must be asc|desc");
                        // neu direction ma invalid thi ko sort 
                        sortByDonor = false;
                    }
                } else {
                    // ko co direction thi ko sort 
                    warnings.add("Param direction missing for sortBy=donor_count: sorting ignored");
                    sortByDonor = false;
                }
            } else {
                warnings.add("Param sortBy ignored: only donor_count is supported");
            }
        }

        Flux<Funds> data;
        if (sortByDonor) {
            data = sortAsc
                    ? fundR2dbcRepository.findFilteredOrderByDonorCountAsc(organizationId, statusId, keyword, tsFrom, tsTo, amtMin, amtMax, limit, offset)
                    : fundR2dbcRepository.findFilteredOrderByDonorCountDesc(organizationId, statusId, keyword, tsFrom, tsTo, amtMin, amtMax, limit, offset);
        } else {
            data = fundR2dbcRepository.findFiltered(organizationId, statusId, keyword, tsFrom, tsTo, amtMin, amtMax, limit, offset);
        }
        Mono<Long> count = fundR2dbcRepository.countFiltered(
                organizationId,
                statusId,
                keyword,
                tsFrom,
                tsTo,
                amtMin,
                amtMax
        );

        return PaginationHelper.paginate(
                data.map(FundListItemResponse::from),
                count,
                page,
                limit
        ).map(paged -> new DataWithWarnings<>(paged, warnings));
    }

    public Mono<FundDetailResponse> getFundDetail(Long fundId) {
        return fundR2dbcRepository.findById(fundId)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.FUND_NOT_FOUND,
                        "Fund not found with id: " + fundId)))
                .flatMap(fund -> {
                    Mono<String> organizationNameMono = organizationRepository.findById(fund.getOrganizationId())
                            .switchIfEmpty(Mono.error(new ApplicationException(
                                    ErrorCode.ORGANIZATION_NOT_FOUND,
                                    "Organization not found with id: " + fund.getOrganizationId())))
                            .map(Organization::getName);

                    Mono<String> statusNameMono = fundStatusRepository.findById(fund.getStatusId())
                            .switchIfEmpty(Mono.error(new ApplicationException(
                                    ErrorCode.FUND_STATUS_NOT_FOUND,
                                    "Fund status not found with id: " + fund.getStatusId())))
                            .map(FundStatus::getName);

                    Integer fundReceivingInfoId = fund.getFundReceivingInfoId();
                    if (fundReceivingInfoId == null) {
                        return Mono.zip(organizationNameMono, statusNameMono)
                                .map(tuple -> FundDetailResponse.from(
                                        fund,
                                        null,
                                        tuple.getT1(),
                                        tuple.getT2()
                                ));
                    }

                    Mono<FundReceivingInfos> receivingInfoMono = fundReceivingInfosRepository.findById(fundReceivingInfoId)
                            .switchIfEmpty(Mono.error(new ApplicationException(
                                    ErrorCode.FUND_RECEIVING_INFO_NOT_FOUND,
                                    "Fund receiving info not found with id: " + fundReceivingInfoId)));

                    return Mono.zip(receivingInfoMono, organizationNameMono, statusNameMono)
                            .map(tuple -> FundDetailResponse.from(
                                    fund,
                                    tuple.getT1(),
                                    tuple.getT2(),
                                    tuple.getT3()
                            ));
                });
    }

    public Mono<PaginatedResponse<FundListItemResponse>> getFundsByStatusId(int page, int limit, Integer statusId) {
        int offset = page * limit;
        return PaginationHelper.paginate(
                fundR2dbcRepository.findByStatusIdWithPagination(statusId, limit, offset).map(FundListItemResponse::from),
                fundR2dbcRepository.countByStatusId(statusId),
                page,
                limit
        );
    }

    public Mono<Funds> updateFund(Long fundId, UpdateFundRequest request) {
        return fundR2dbcRepository.findById(fundId)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.FUND_NOT_FOUND,
                        "Fund not found with id: " + fundId)))
                .flatMap(existing -> {
                    LocalDateTime now = LocalDateTime.now();
                    LocalDateTime minAllowedTime = now.plusMinutes(10);
                    LocalDateTime oldStart = existing.getTimeStarted();
                    LocalDateTime oldEnd = existing.getTimeEnded();
                    LocalDateTime newStart = request.getTimeStarted();
                    LocalDateTime newEnd = request.getTimeEnded();
                    BigDecimal newTargetAmount = request.getTargetAmount();
                    Integer newFundReceivingInfoId = request.getFundReceivingInfoId();
                    Integer newStatusId = request.getStatusId();

                    if (!newEnd.isAfter(newStart)) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.FUND_INVALID_TIME_RANGE,
                                "Thời gian kết thúc phải sau thời gian bắt đầu"
                        ));
                    }

                    boolean isBeforeStart = now.isBefore(oldStart) && oldStart.isBefore(oldEnd);
                    boolean isActive = oldStart.isBefore(now) && now.isBefore(oldEnd);
                    boolean isEnded = oldStart.isBefore(oldEnd) && oldEnd.isBefore(now);

                    if (isEnded) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.FUND_ALREADY_ENDED,
                                "Quỹ đã kết thúc, không thể chỉnh sửa bất kì cái gì"
                        ));
                    }

                    if (isBeforeStart && newStart.isBefore(minAllowedTime)) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.FUND_TIME_TOO_EARLY,
                                "Thời gian bắt đầu phải từ thời điểm hiện tại + 10 phút"
                        ));
                    }

                    if (isActive) {
                        if (!newStart.isEqual(oldStart)) {
                            return Mono.error(new ApplicationException(
                                    ErrorCode.FUND_START_TIME_UPDATE_NOT_ALLOWED,
                                    "Quỹ đang diễn ra, không thể sửa thời gian bắt đầu"
                            ));
                        }

                        if (newEnd.isBefore(minAllowedTime)) {
                            return Mono.error(new ApplicationException(
                                    ErrorCode.FUND_TIME_TOO_EARLY,
                                    "Khi quỹ đang diễn ra, thời gian kết thúc mới phải từ hiện tại + 10 phút"
                            ));
                        }

                        if (newTargetAmount.compareTo(existing.getTargetAmount()) != 0) {
                            return Mono.error(new ApplicationException(
                                    ErrorCode.FUND_TARGET_AMOUNT_UPDATE_NOT_ALLOWED,
                                    "Quỹ đang diễn ra, không thể sửa mục tiêu quỹ"
                            ));
                        }

                        if (!newFundReceivingInfoId.equals(existing.getFundReceivingInfoId())) {
                            return Mono.error(new ApplicationException(
                                    ErrorCode.FUND_RECEIVING_INFO_UPDATE_NOT_ALLOWED,
                                    "Quỹ đang diễn ra, không thể sửa tài khoản nhận quỹ"
                            ));
                        }
                    }

                    return Mono.zip(
                                    fundReceivingInfosRepository.findById(newFundReceivingInfoId)
                                            .switchIfEmpty(Mono.error(new ApplicationException(
                                                    ErrorCode.FUND_RECEIVING_INFO_NOT_FOUND,
                                                    "Fund receiving info not found with id: " + newFundReceivingInfoId
                                            ))),
                                    fundStatusRepository.findById(newStatusId)
                                            .switchIfEmpty(Mono.error(new ApplicationException(
                                                    ErrorCode.FUND_STATUS_NOT_FOUND,
                                                    "Fund status not found with id: " + newStatusId
                                            )))
                            )
                            .flatMap(tuple -> {
                                String newLogoUrl = request.getLogoUrl();
                                existing.setName(request.getName().trim());
                                existing.setDescriptionShort(request.getDescriptionShort().trim());
                                existing.setDescriptionFull(request.getDescriptionFull().trim());
                                if (newLogoUrl != null) {
                                    String trimmedLogoUrl = newLogoUrl.trim();
                                    existing.setLogoUrl(trimmedLogoUrl.isEmpty() ? null : trimmedLogoUrl);
                                }
                                existing.setManagerName(request.getManagerName().trim());
                                existing.setTargetAmount(newTargetAmount);
                                existing.setFundReceivingInfoId(newFundReceivingInfoId);
                                existing.setStatusId(newStatusId);
                                existing.setTimeStarted(newStart);
                                existing.setTimeEnded(newEnd);
                                if (request.getTopic() != null) existing.setTopic(request.getTopic());
                                return fundR2dbcRepository.save(existing);
                            });
                });
    }

    public Mono<Funds> closeFund(Long fundId) {
        return fundR2dbcRepository.findById(fundId)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.FUND_NOT_FOUND,
                        "Fund not found with id: " + fundId)))
                .flatMap(existing -> {
                    existing.setTimeEnded(LocalDateTime.now());
                    return fundR2dbcRepository.save(existing);
                });
    }

    @Transactional
    public Mono<FundDonations> createFundDonation(CreateFundDonationRequest request) {
        Integer fundId = request.getFundId();
        Integer donorMemberId = request.getDonorMemberId();
        String resolvedDonorName = (request.getDonorName() != null && !request.getDonorName().isBlank())
                ? request.getDonorName()
                : "Ẩn danh";

        // khi guest ko dang nhap ma donate thi field donorMemberId la null
        if (donorMemberId == null) {
            FundDonations donation = FundDonations.builder()
                    .fundId(fundId)
                    .donorMemberId(null)
                    .donorName(resolvedDonorName)
                    .amount(request.getAmount())
                    .address(request.getAddress())
                    .phone(request.getPhone())
                    .email(request.getEmail())
                    .message(request.getMessage())
                    .status(Status.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build();
            return fundDonationsRepository.save(donation);
        }

        // neu donor member id ma ton tai trong body thi kiem tra su ton tai trong table user
        return userRepository.findById(donorMemberId)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.USER_NOT_FOUND,
                        "User not found with id: " + donorMemberId
                )))
                .flatMap(user -> {
                    FundDonations donation = FundDonations.builder()
                            .fundId(fundId)
                            .donorMemberId(donorMemberId)
                            .donorName(resolvedDonorName)
                            .amount(request.getAmount())
                            .address(request.getAddress())
                            .phone(request.getPhone())
                            .email(request.getEmail())
                            .message(request.getMessage())
                            .status(Status.PENDING)
                            .createdAt(LocalDateTime.now())
                            .build();
                    return fundDonationsRepository.save(donation);
                });
    }

    public Mono<FundDonationCheckoutResponse> createFundDonationAndPaymentLink(CreateFundDonationRequest request) {
        return createFundDonation(request)
                .flatMap(savedDonation -> getFundReceivingInfoByFundId(savedDonation.getFundId())
                        .flatMap(receivingInfo -> resolveBankCode(receivingInfo.getBankName())
                        .map(bankCode -> {
                            long amountInVnd = normalizeAmountToVnd(request.getAmount());
                            String description = buildDescription(request.getMessage(), savedDonation.getId());

                            String qrUrl = UriComponentsBuilder.fromUriString(sepayQrImgUrl)
                                    .queryParam("acc", receivingInfo.getAccountNumber())
                                    .queryParam("bank", bankCode)
                                    .queryParam("amount", amountInVnd)
                                    .queryParam("des", description)
                                    .build()
                                    .toUriString();
                            return new FundDonationCheckoutResponse(qrUrl);
                        })));
    }

    private Mono<FundReceivingInfos> getFundReceivingInfoByFundId(Integer fundId) {
        return fundR2dbcRepository.findById(fundId.longValue())
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.FUND_NOT_FOUND,
                        "Fund not found with id: " + fundId)))
                .flatMap(fund -> {
                    Integer receivingInfoId = fund.getFundReceivingInfoId();
                    if (receivingInfoId == null) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.FUND_RECEIVING_INFO_NOT_FOUND,
                                "Fund receiving info not configured for fund id: " + fundId
                        ));
                    }
                    return fundReceivingInfosRepository.findById(receivingInfoId)
                            .switchIfEmpty(Mono.error(new ApplicationException(
                                    ErrorCode.FUND_RECEIVING_INFO_NOT_FOUND,
                                    "Fund receiving info not found with id: " + receivingInfoId
                            )));
                });
    }

    private long normalizeAmountToVnd(BigDecimal amount) {
        try {
            return amount.longValueExact();
        } catch (ArithmeticException ex) {
            throw new ApplicationException(
                    ErrorCode.RESOURCES_NOT_FOUND,
                    "Invalid donation amount: amount must be an integer VND value"
            );
        }
    }

    private String buildDescription(String message, Integer donationId) {
        String marker = "FD" + donationId;
        if (message == null || message.isBlank()) {
            return marker;
        }
        return message.trim() + " " + marker;
    }

    private Mono<String> resolveBankCode(String bankCode) {
        if (bankCode == null || bankCode.isBlank()) {
            return Mono.error(new ApplicationException(
                    ErrorCode.RESOURCES_NOT_FOUND,
                    "Bank code is empty in fund receiving info"
            ));
        }
        String normalizedCode = bankCode.trim();
        return getSupportedBanks()
                .flatMap(banks -> banks.stream()
                        .filter(bank -> isBankMatched(bank, normalizedCode))
                        .findFirst()
                        .map(bank -> Mono.just(bank.getCode()))
                        .orElseGet(() -> Mono.error(new ApplicationException(
                                ErrorCode.RESOURCES_NOT_FOUND,
                                "Cannot map bankName to code from banks.json. bankName=" + bankCode
                        ))));
    }

    private boolean isBankMatched(BankInfoDto bank, String bankCode) {
        return bankCode.equals(bank.getCode());
    }

    private Mono<List<BankInfoDto>> getSupportedBanks() {
        String cacheName = "fund-banks";
        String cacheKey = "banks-json-supported";
        return cacheUtils.getOrCompute(cacheName, cacheKey, Duration.ofHours(24), () -> {
            BanksPayloadDto payload = JsonUtils.fromResource("banks.json", BanksPayloadDto.class);
            List<BankInfoDto> banks = payload == null || payload.getData() == null
                    ? List.of()
                    : payload.getData().stream()
                    .filter(bank -> Boolean.TRUE.equals(bank.getSupported()))
                    .toList();
            return Mono.just(banks);
        });
    }

    public Mono<PaginatedResponse<FundDonationListItemResponse>> getDonationsByFund(
            long fundId,
            int page,
            int limit,
            String searchBy,
            String keyword
    ) {
        int offset = page * limit;
        boolean hasSearch = searchBy != null && !searchBy.isBlank() && keyword != null && !keyword.isBlank();

        if (!hasSearch) {
            return PaginationHelper.paginate(
                    fundDonationsRepository.findByFundIdWithPagination(fundId, limit, offset).map(FundDonationListItemResponse::fromProjection),
                    fundDonationsRepository.countByFundId(fundId),
                    page,
                    limit);
        }

        String normalized = keyword.trim();
        return switch (searchBy) {
            case "name" -> PaginationHelper.paginate(
                    fundDonationsRepository.searchByDonorName(fundId, normalized, limit, offset).map(FundDonationListItemResponse::fromProjection),
                    fundDonationsRepository.countSearchByDonorName(fundId, normalized),
                    page, limit);
            case "phone" -> PaginationHelper.paginate(
                    fundDonationsRepository.searchByPhone(fundId, normalized, limit, offset).map(FundDonationListItemResponse::fromProjection),
                    fundDonationsRepository.countSearchByPhone(fundId, normalized),
                    page, limit);
            case "address" -> PaginationHelper.paginate(
                    fundDonationsRepository.searchByAddress(fundId, normalized, limit, offset).map(FundDonationListItemResponse::fromProjection),
                    fundDonationsRepository.countSearchByAddress(fundId, normalized),
                    page, limit);
            case "message" -> PaginationHelper.paginate(
                    fundDonationsRepository.searchByMessage(fundId, normalized, limit, offset).map(FundDonationListItemResponse::fromProjection),
                    fundDonationsRepository.countSearchByMessage(fundId, normalized),
                    page, limit);
            case "email" -> PaginationHelper.paginate(
                    fundDonationsRepository.searchByEmail(fundId, normalized, limit, offset).map(FundDonationListItemResponse::fromProjection),
                    fundDonationsRepository.countSearchByEmail(fundId, normalized),
                    page, limit);
            default -> Mono.error(new ApplicationException(
                    ErrorCode.RESOURCES_NOT_FOUND,
                    "Unsupported searchBy value"
            ));
        };
    }

    public Mono<PaginatedResponse<FundDonationListItemResponse>> getDonationsByDonorMemberId(
            Integer donorMemberId,
            int page,
            int limit
    ) {
        int offset = page * limit;
        return PaginationHelper.paginate(
                fundDonationsRepository.findByDonorMemberIdWithPagination(donorMemberId, limit, offset)
                        .map(FundDonationListItemResponse::fromProjection),
                fundDonationsRepository.countByDonorMemberId(donorMemberId),
                page, limit)
                .doOnSuccess(r -> org.slf4j.LoggerFactory.getLogger(FundService.class).info("getDonationsByDonorMemberId result: {}", com.service.backend.shared.utils.JsonUtils.toJson(r)));
    }

    public Mono<FundStatisticsResponse> getFundStatistics() {
        LocalDateTime now = LocalDateTime.now();
        Mono<BigDecimal> totalCurrentAmountMono = fundR2dbcRepository.sumCurrentAmount();
        Mono<Long> totalFundsMono = fundR2dbcRepository.countOpenFunds(now);
        Mono<Long> totalDonationsMono = fundDonationsRepository.countAll();
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1);
        Mono<BigDecimal> totalDonationsAmountThisMonthMono = fundDonationsRepository.sumAmountBetween(startOfMonth, endOfMonth);

        return Mono.zip(totalCurrentAmountMono, totalFundsMono, totalDonationsMono, totalDonationsAmountThisMonthMono)
                .map(tuple -> FundStatisticsResponse.builder()
                        .totalCurrentAmount(tuple.getT1())
                        .totalFunds(tuple.getT2())
                        .totalDonations(tuple.getT3())
                        .totalDonationsAmountThisMonth(tuple.getT4())
                        .build());
    }
}
