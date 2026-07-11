package com.service.backend.shared.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.nimbusds.jwt.JWTClaimsSet;
import com.service.backend.shared.annotations.PublicEndpoint;
import com.service.backend.shared.service.SseService;
import com.service.backend.shared.utils.JwtUtils;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;

/**
 * Server-Sent Events endpoint. The browser opens a long-lived {@code EventSource}
 * to receive real-time pushes (feature toggles, verification changes, bans, new
 * chat messages).
 *
 * <p>{@code EventSource} cannot set an {@code Authorization} header, so the JWT is
 * passed as a {@code ?token=} query param and validated here — the same approach the
 * chat WebSocket handler uses. The endpoint is therefore marked {@link PublicEndpoint}
 * (the security filter only reads the {@code Authorization} header) and does its own
 * token validation.
 */
@RestController
@RequestMapping("/api/sse")
@RequiredArgsConstructor
public class SseController {

    private static final Logger log = LoggerFactory.getLogger(SseController.class);

    private final SseService sseService;
    private final JwtUtils jwtUtils;

    @PublicEndpoint
    @GetMapping(value = "/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<Object>> connect(@RequestParam("token") String token) {
        Long userId;
        Integer organizationId;
        try {
            JWTClaimsSet claims = jwtUtils.validateToken(token);
            userId = Long.valueOf(claims.getSubject());
            Object orgIdClaim = claims.getClaim("organizationId");
            organizationId = orgIdClaim instanceof Number number ? number.intValue() : null;
        } catch (Exception e) {
            log.warn("Rejected SSE connection with invalid token: {}", e.getMessage());
            return Flux.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token"));
        }
        return sseService.connect(userId, organizationId);
    }
}
