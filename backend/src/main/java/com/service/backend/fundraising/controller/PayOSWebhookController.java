package com.service.backend.fundraising.controller;

import com.service.backend.fundraising.dao.FundDonationsR2dbcRepository;
import com.service.backend.shared.entity.FundDonations;
import com.service.backend.shared.enums.Status;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import vn.payos.PayOS;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Payments > Webhooks", description = "API endpoints for PayOS payment webhooks")
@RestController
@RequestMapping("/api/payment/payos")
@RequiredArgsConstructor
public class PayOSWebhookController {

    private final PayOS payOS;
    private final FundDonationsR2dbcRepository fundDonationsRepository;

    @PostMapping("/webhook")
    public Mono<ResponseEntity<Object>> handleWebhook(@RequestBody Map<String, Object> body) {
        return Mono.fromCallable(() -> {
                    // verify signature neu loi thi throw
                    payOS.webhooks().verify(body);
                    return body;
                })
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(this::updateDonationStatus)
                .then(Mono.just(ResponseEntity.ok().build()))
                .onErrorResume(ex -> Mono.just(ResponseEntity.badRequest().build()));
    }

    private Mono<FundDonations> updateDonationStatus(Map<String, Object> webhookBody) {
        if (webhookBody == null) {
            return Mono.empty();
        }

        Object dataObj = webhookBody.get("data");
        if (!(dataObj instanceof Map<?, ?> dataMap)) {
            return Mono.empty();
        }

        Object orderCodeObj = dataMap.get("orderCode");
        if (!(orderCodeObj instanceof Number num)) {
            return Mono.empty();
        }

        long orderCode = num.longValue();
        int donationId = Math.toIntExact(orderCode);

        Object codeObj = webhookBody.get("code");
        String code = codeObj instanceof String ? (String) codeObj : null;

        return fundDonationsRepository.findById(donationId)
                .flatMap(existing -> {
                    if (existing.getStatus() == Status.SUCCESS) {
                        // da success roi thi ko process nua
                        return Mono.just(existing);
                    }

                    Status newStatus = "00".equals(code) ? Status.SUCCESS : Status.CANCELLED;
                    existing.setStatus(newStatus);
                    return fundDonationsRepository.save(existing);
                });
    }
}

