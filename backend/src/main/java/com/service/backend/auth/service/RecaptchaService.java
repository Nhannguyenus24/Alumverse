package com.service.backend.auth.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.http.MediaType;
import reactor.core.publisher.Mono;

@Service
public class RecaptchaService {
    private static final Logger logger = LoggerFactory.getLogger(RecaptchaService.class);
    private final WebClient webClient;

    @Value("${google.recaptcha.secret-key}")
    private String recaptchaSecret;

    public RecaptchaService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://www.google.com/recaptcha/api").build();
    }

    public Mono<Boolean> verifyRecaptcha(String recaptchaResponse) {
        if (recaptchaResponse == null || recaptchaResponse.isEmpty()) {
            return Mono.just(true);
        }

        return webClient.post()
                .uri("/siteverify")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData("secret", recaptchaSecret)
                                   .with("response", recaptchaResponse))
                .retrieve()
                .bodyToMono(RecaptchaResponse.class)
                .map(response -> {
                    if (!response.isSuccess()) {
                        logger.error("reCAPTCHA validation failed. Error codes: {}", response.getErrorCodes());
                    }
                    return response.isSuccess();
                })
                .onErrorResume(e -> {
                    logger.error("Error verifying reCAPTCHA: {}", e.getMessage());
                    return Mono.just(false);
                });
    }

    @Setter
    @Getter
    private static class RecaptchaResponse {
        private boolean success;
        @JsonProperty("error-codes")
        private java.util.List<String> errorCodes;

    }
}
