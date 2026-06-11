package com.service.backend.chat.controller;

import com.service.backend.chat.dto.BlockStatusResponse;
import com.service.backend.chat.dto.BlockedMemberItemResponse;
import com.service.backend.chat.service.UserBlockService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.entity.UserBlock;
import com.service.backend.shared.utils.SecurityUtils;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/chat/blocks")
@Validated
@RequiredArgsConstructor
public class UserBlockController {

    private final UserBlockService userBlockService;

    @PostMapping("/{targetMemberId}")
    public Mono<ResponseEntity<ApiResponse<UserBlock>>> blockUser(
            @PathVariable @Min(1) Long targetMemberId) {

        return Mono.zip(SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentOrganizationId())
                .flatMap(tuple -> userBlockService.blockUser(
                        tuple.getT1(),
                        targetMemberId,
                        tuple.getT2()))
                .map(result -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Member blocked successfully", result)));
    }

    @DeleteMapping("/{targetMemberId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> unblockUser(
            @PathVariable @Min(1) Long targetMemberId) {

        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> userBlockService.unblockUser(currentMemberId, targetMemberId))
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("Member unblocked successfully", null))));
    }

    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<BlockedMemberItemResponse>>>> searchBlockedMembers(
            @RequestParam(required = false) String fullName,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "5") @Min(1) int size) {

        return SecurityUtils.getCurrentUserId()
                .flatMap(currentUserId -> userBlockService.searchBlockedMembers(
                        currentUserId, fullName, page, size))
                .map(result -> ResponseEntity.ok(
                        new ApiResponse<>("Blocked members retrieved successfully", result)));
    }

    @GetMapping("/{targetMemberId}")
    public Mono<ResponseEntity<ApiResponse<BlockStatusResponse>>> getBlockStatus(
            @PathVariable @Min(1) Long targetMemberId) {

        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> userBlockService.getBlockStatus(currentMemberId, targetMemberId))
                .map(result -> ResponseEntity.ok(new ApiResponse<>("Block status retrieved successfully", result)));
    }
}
