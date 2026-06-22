package com.service.backend.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.user.dto.CreateEducationChangeRequestDTO;
import com.service.backend.user.dto.EducationChangeRequestResponseDTO;
import com.service.backend.user.service.EducationRequestService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Tag(name = "Users > Education Requests", description = "API for submitting education change requests for admin review")
@RestController
@RequestMapping("/api/education-requests")
@Validated
@RequiredArgsConstructor
public class EducationRequestController {

    private final EducationRequestService educationRequestService;

    @PostMapping
    public Mono<ResponseEntity<ApiResponse<EducationChangeRequestResponseDTO>>> submitRequest(
            @Valid @RequestBody CreateEducationChangeRequestDTO dto) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> educationRequestService.submitRequest(userId, dto))
                .map(result -> ResponseEntity.ok(new ApiResponse<>("Yêu cầu thay đổi học vấn đã được gửi.", result)));
    }

    @GetMapping("/pending")
    public Mono<ResponseEntity<ApiResponse<EducationChangeRequestResponseDTO>>> getPendingRequest(
            @RequestParam @NotNull Integer organizationId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> educationRequestService.getPendingRequest(userId, organizationId))
                .map(result -> ResponseEntity.ok(new ApiResponse<>("Lấy yêu cầu đang chờ thành công.", result)))
                .defaultIfEmpty(ResponseEntity.ok(new ApiResponse<>("Không có yêu cầu đang chờ.", null)));
    }

    @DeleteMapping("/{requestId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> cancelRequest(
            @PathVariable Integer requestId,
            @RequestParam @NotNull Integer organizationId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> educationRequestService.cancelRequest(userId, requestId, organizationId))
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<Void>("Yêu cầu đã được hủy.", null))));
    }
}
