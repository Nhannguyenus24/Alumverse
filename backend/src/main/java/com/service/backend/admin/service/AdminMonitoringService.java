package com.service.backend.admin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * Proxy các truy vấn timeseries của Datadog cho trang Admin → System Monitoring.
 *
 * <p>Trước đây frontend gọi thẳng {@code https://api.<site>/api/v1/query} từ browser,
 * nhưng Datadog không hỗ trợ CORS cho trình duyệt (preflight trả 404) và cách đó làm
 * lộ API/APP key trong bundle JS. Service này giữ key ở phía server, gọi Datadog
 * server-to-server (không dính CORS) và chỉ được mở cho ADMIN qua controller.
 */
@Service
public class AdminMonitoringService {

    private static final Logger log = LoggerFactory.getLogger(AdminMonitoringService.class);

    private final WebClient webClient;
    private final String apiKey;
    private final String appKey;

    public AdminMonitoringService(WebClient.Builder webClientBuilder,
                                  @Value("${datadog.site:datadoghq.com}") String site,
                                  @Value("${datadog.api-key:}") String apiKey,
                                  @Value("${datadog.app-key:}") String appKey) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.appKey = appKey == null ? "" : appKey.trim();
        this.webClient = webClientBuilder
                .baseUrl("https://api." + site)
                .build();
    }

    /**
     * Chuyển tiếp một truy vấn v1 timeseries tới Datadog và trả nguyên body JSON
     * ({@code { series: [...] }}) để phần parse ở frontend giữ nguyên. Datadog tự
     * giải mã (decode) giá trị {@code query} nên WebClient cứ encode bình thường.
     *
     * @param query chuỗi truy vấn Datadog (vd: {@code sum:http.endpoint.requests{*}.as_rate()})
     * @param from  epoch giây (đầu khoảng)
     * @param to    epoch giây (cuối khoảng)
     */
    public Mono<JsonNode> query(String query, long from, long to) {
        if (apiKey.isBlank() || appKey.isBlank()) {
            log.warn("Datadog query rejected: DATADOG_API_KEY / DATADOG_APP_KEY chưa được cấu hình");
            return Mono.error(new ApplicationException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Datadog credentials are not configured on the server"));
        }
        return webClient.get()
                .uri(uri -> uri.path("/api/v1/query")
                        .queryParam("from", from)
                        .queryParam("to", to)
                        .queryParam("query", query)
                        .build())
                .header("DD-API-KEY", apiKey)
                .header("DD-APPLICATION-KEY", appKey)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .onErrorResume(err -> {
                    log.error("Datadog query failed [{}]: {}", query, err.toString());
                    return Mono.error(new ApplicationException(ErrorCode.INTERNAL_SERVER_ERROR,
                            "Failed to query Datadog"));
                });
    }
}
