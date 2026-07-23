package com.service.backend.fitbot.service;

import com.service.backend.config.ai.DynamicChatModel;
import com.service.backend.fitbot.dto.FitBotQueryRequest;
import com.service.backend.fitbot.dto.FitBotQueryResponse;
import com.service.backend.fitbot.dto.FitBotRetrieveResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.output.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Map;

@Service
public class FitBotService {

    private final WebClient fitBotClient;
    private final DynamicChatModel chatModel;

    public FitBotService(WebClient.Builder webClientBuilder,
                         DynamicChatModel chatModel,
                         @Value("${fitbot.api-url:http://167.99.79.46}") String fitBotApiUrl) {
        this.fitBotClient = webClientBuilder.clone().baseUrl(fitBotApiUrl).build();
        this.chatModel = chatModel;
    }

    public Mono<FitBotQueryResponse> answer(FitBotQueryRequest request) {
        return retrieve(request)
                .flatMap(retrieved -> Mono.fromCallable(() -> generate(retrieved.prompt()))
                        .subscribeOn(Schedulers.boundedElastic())
                        .map(answer -> new FitBotQueryResponse(answer, retrieved.sources())));
    }

    private Mono<FitBotRetrieveResponse> retrieve(FitBotQueryRequest request) {
        Map<String, Object> body = Map.of(
                "question", request.question(),
                "top_k", request.resolvedTopK(),
                "use_reranker", request.resolvedUseReranker()
        );

        return fitBotClient.post()
                .uri("/api/retrieve")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(FitBotRetrieveResponse.class)
                .onErrorMap(e -> new ApplicationException(
                        ErrorCode.INTERNAL_SERVER_ERROR,
                        "FitBot retrieval service unavailable",
                        e));
    }

    public Mono<Void> addDocument(String source, String content) {
        return fitBotClient.post()
                .uri("/api/documents")
                .bodyValue(Map.of("source", source, "content", content))
                .retrieve()
                .bodyToMono(Void.class);
    }

    public Mono<Void> deleteSource(String source) {
        return fitBotClient.delete()
                .uri(uriBuilder -> uriBuilder.path("/api/sources/{source}").build(source))
                .exchangeToMono(response -> {
                    int status = response.statusCode().value();
                    if (response.statusCode().is2xxSuccessful() || status == 404) {
                        return Mono.empty();
                    }
                    return response.createException().flatMap(Mono::error);
                });
    }

    private String generate(String prompt) {
        try {
            Response<AiMessage> response = chatModel.generate(UserMessage.from(prompt));
            if (response == null || response.content() == null || response.content().text() == null) {
                throw new ApplicationException(ErrorCode.INTERNAL_SERVER_ERROR, "FitBot AI returned empty response");
            }
            return response.content().text();
        } catch (DynamicChatModel.AiUnavailableException e) {
            throw new ApplicationException(ErrorCode.INTERNAL_SERVER_ERROR, "No AI model is configured", e);
        }
    }
}
