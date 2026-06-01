package com.service.backend.fundraising.controller;

import com.service.backend.fundraising.dto.CreateFundReceivingInfosRequest;
import com.service.backend.shared.entity.FundReceivingInfos;
import com.service.backend.fundraising.service.FundService;
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
@RequestMapping("/api/funds/receiving-infos")
@RequiredArgsConstructor
@Validated
public class FundReceivingInfosController {

    private final FundService fundService;

    @PostMapping
    public Mono<ResponseEntity<ApiResponse<FundReceivingInfos>>> create(
            @Valid @RequestBody CreateFundReceivingInfosRequest request) {
        return fundService.createFundReceivingInfos(request)
                .map(created -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Fund receiving info created successfully", created)));
    }

    @GetMapping("/active")
    public Mono<ResponseEntity<ApiResponse<List<FundReceivingInfos>>>> getAllActive() {
        return fundService.getActiveFundReceivingInfos()
                .collectList()
                .map(list -> ResponseEntity.ok(
                        new ApiResponse<>("Active fund receiving infos retrieved successfully", list)));
    }
}

