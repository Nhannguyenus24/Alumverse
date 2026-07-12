package com.service.backend.config;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * WebFilter to track latency for ALL HTTP endpoints (Spring WebFlux).
 * Metrics recorded:
 * - http.endpoint.latency (by method, path, status)
 * - http.endpoint.requests (counter by method, path, status)
 * - http.endpoint.errors (counter by method, path)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MetricsFilter implements WebFilter {

    private final MeterRegistry meterRegistry;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String method = exchange.getRequest().getMethod().toString();
        String path = normalizeUri(exchange.getRequest().getPath().value());
        long startTime = System.currentTimeMillis();

        return chain.filter(exchange)
                .doFinally(signalType -> {
                    long duration = System.currentTimeMillis() - startTime;
                    int status = exchange.getResponse().getStatusCode() != null
                            ? exchange.getResponse().getStatusCode().value()
                            : 500;
                    recordMetrics(method, path, status, duration);
                });
    }

    private void recordMetrics(String method, String path, int status, long durationMs) {
        try {
            if (path.startsWith("/actuator") || path.startsWith("/internal/actuator") || path.startsWith("/swagger") ||
                path.startsWith("/v3/api-docs") || isStaticFile(path) || isStreamingEndpoint(path)) {
                // Long-lived streaming endpoints (SSE, WebSocket) stay open for minutes by
                // design; recording their duration pollutes the latency histogram and floods
                // logs with false "SLOW REQUEST" warnings. They have dedicated gauges instead.
                return;
            }

            // 1. Record latency histogram (for percentiles: p50, p95, p99)
            Timer.builder("http.endpoint.latency")
                    .description("HTTP endpoint latency")
                    .tag("method", method)
                    .tag("path", path)
                    .tag("status", String.valueOf(status))
                    .publishPercentiles(0.5, 0.95, 0.99)
                    .publishPercentileHistogram(true)
                    .register(meterRegistry)
                    .record(java.time.Duration.ofMillis(durationMs));

            // 2. Record request counter
            meterRegistry.counter(
                    "http.endpoint.requests",
                    "method", method,
                    "path", path,
                    "status", String.valueOf(status)
            ).increment();

            // 3. Record error counter
            if (status >= 400) {
                meterRegistry.counter(
                        "http.endpoint.errors",
                        "method", method,
                        "path", path,
                        "status", String.valueOf(status)
                ).increment();
            }

            // 4. Log slow requests (> 1000ms)
            if (durationMs > 1000) {
                log.warn("SLOW REQUEST: {} {} - {} ms (status: {})",
                        method, path, durationMs, status);
            }

        } catch (Exception e) {
            log.error("Error recording metrics for {} {}", method, path, e);
        }
    }

    private boolean isStreamingEndpoint(String path) {
        return path.startsWith("/api/sse") || path.startsWith("/ws");
    }

    private boolean isStaticFile(String path) {
        return path.endsWith(".css") || path.endsWith(".js") ||
               path.endsWith(".png") || path.endsWith(".jpg") ||
               path.endsWith(".gif") || path.endsWith(".woff");
    }

    /**
     * Normalize URI to avoid cardinality explosion.
     * Convert /users/123 to /users/{id}
     * Convert /news/456 to /news/{id}
     */
    private String normalizeUri(String uri) {
        if (uri == null || uri.isEmpty()) {
            return "/";
        }

        // Remove query string
        if (uri.contains("?")) {
            uri = uri.substring(0, uri.indexOf("?"));
        }

        // Convert numeric path segments to {id}
        String[] segments = uri.split("/");
        StringBuilder normalized = new StringBuilder();

        for (String segment : segments) {
            if (!segment.isEmpty()) {
                // If segment is numeric, replace with {id}
                if (segment.matches("\\d+")) {
                    normalized.append("/{id}");
                } else {
                    normalized.append("/").append(segment);
                }
            }
        }

        return normalized.isEmpty() ? "/" : normalized.toString();
    }

}
