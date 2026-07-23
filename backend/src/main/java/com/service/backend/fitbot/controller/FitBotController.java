package com.service.backend.fitbot.controller;

import com.service.backend.fitbot.dto.FitBotQueryRequest;
import com.service.backend.fitbot.dto.FitBotQueryResponse;
import com.service.backend.fitbot.service.FitBotService;
import com.service.backend.shared.annotations.PublicEndpoint;
import com.service.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

@PublicEndpoint
@RestController
@RequestMapping("/api/fitbot")
@RequiredArgsConstructor
@Validated
public class FitBotController {

    private final FitBotService fitBotService;

    @PostMapping("/query")
    public Mono<ResponseEntity<ApiResponse<FitBotQueryResponse>>> query(
            @Valid @RequestBody FitBotQueryRequest request) {
        return fitBotService.answer(request)
                .map(answer -> ResponseEntity.ok(new ApiResponse<>("FitBot answered successfully", answer)));
    }

    @PostMapping(value = "/stream-query", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<Map<String, Object>>> streamQuery(
            @Valid @RequestBody FitBotQueryRequest request,
            ServerHttpResponse response) {
        response.getHeaders().set("X-Accel-Buffering", "no");
        response.getHeaders().set("Cache-Control", "no-cache");

        return fitBotService.answer(request)
                .flatMapMany(answer -> Flux.just(
                        event(Map.of("type", "sources", "sources", answer.sources())),
                        event(Map.of("type", "content", "content", answer.answer())),
                        event(Map.of("type", "done"))
                ));
    }

    private ServerSentEvent<Map<String, Object>> event(Map<String, Object> data) {
        return ServerSentEvent.builder(data).build();
    }
}
