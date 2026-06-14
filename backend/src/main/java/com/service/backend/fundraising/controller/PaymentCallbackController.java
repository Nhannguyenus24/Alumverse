package com.service.backend.fundraising.controller;

import com.service.backend.fundraising.dao.FundDonationsR2dbcRepository;
import com.service.backend.shared.enums.Status;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Payments > Webhooks", description = "API endpoints for generic payment callbacks")
@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentCallbackController {

    private final FundDonationsR2dbcRepository fundDonationsRepository;

    @GetMapping("/cancel")
    public Mono<ResponseEntity<Map<String, Object>>> handleCancel(
            @RequestParam("code") String code,
            @RequestParam("id") String paymentLinkId,
            @RequestParam("cancel") boolean cancel,
            @RequestParam("status") String status,
            @RequestParam("orderCode") Long orderCode
    ) {
        return fundDonationsRepository.findById(orderCode.intValue())
                .flatMap(existing -> {
                    if (existing.getStatus() == Status.SUCCESS) {
                        return Mono.just(existing);
                    }
                    Status newStatus;
                    try {
                        newStatus = Status.valueOf(status);
                    } catch (IllegalArgumentException ex) {
                        // status ko map duoc, giu nguyen ko doi
                        log.warn("Unknown status from PayOS cancel callback: '{}', keep existing status {} for donation id={}",
                                status, existing.getStatus(), existing.getId());
                        newStatus = existing.getStatus();
                    }
                    existing.setStatus(newStatus);
                    return fundDonationsRepository.save(existing);
                })
                .defaultIfEmpty(null)
                .map(updated -> {
                    Map<String, Object> body = Map.of(
                            "code", code,
                            "paymentLinkId", paymentLinkId,
                            "cancel", cancel,
                            "status", status,
                            "orderCode", orderCode
                    );
                    return ResponseEntity.ok(body);
                });
    }
}
