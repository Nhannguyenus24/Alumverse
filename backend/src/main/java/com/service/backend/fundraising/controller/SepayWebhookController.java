package com.service.backend.fundraising.controller;

import com.service.backend.fundraising.service.SepayWebhookService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Payments > Webhooks", description = "API endpoints for Sepay payment webhooks")
@RestController
@RequestMapping("/api/payment/sepay")
@RequiredArgsConstructor
public class SepayWebhookController {

    private final SepayWebhookService sepayWebhookService;

    @PostMapping("/webhook")
    public Mono<ResponseEntity<Map<String, Boolean>>> handleWebhook(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody Map<String, Object> body
    ) {
        return sepayWebhookService.processWebhook(authorizationHeader, body)
                .map(ResponseEntity::ok);
    }
}
