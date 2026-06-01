package com.service.backend.fundraising.controller;

import com.service.backend.fundraising.dao.FundStatusR2dbcRepository;
import com.service.backend.fundraising.dto.CreateFundStatusRequest;
import com.service.backend.shared.entity.FundStatus;
import com.service.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/fund-statuses")
@RequiredArgsConstructor
@Validated
public class FundStatusController {

    private final FundStatusR2dbcRepository fundStatusRepository;

    @PostMapping
    public Mono<ResponseEntity<ApiResponse<FundStatus>>> create(
            @Valid @RequestBody CreateFundStatusRequest request) {
        FundStatus entity = FundStatus.builder()
                .name(request.getName())
                .build();

        return fundStatusRepository.save(entity)
                .map(created -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Fund status created successfully", created)));
    }

    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<FundStatus>>>> getAll() {
        return fundStatusRepository.findAll()
                .collectList()
                .map(list -> ResponseEntity.ok(
                        new ApiResponse<>("Fund statuses retrieved successfully", list)));
    }
}

