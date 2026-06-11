package com.service.backend.config;

import com.service.backend.shared.dto.BatchModerationResponse;
import com.service.backend.shared.service.ModerationService;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.service.AiServices;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.stream.Collectors;

@Configuration
public class LangChain4jConfig {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.model.name:gemini-1.5-flash}")
    private String geminiModelName;

    @Value("${gemini.model.temperature:0.0}")
    private double geminiModelTemperature;

    @Bean
    public ModerationService moderationService() {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            Logger log = LoggerFactory.getLogger(LangChain4jConfig.class);
            log.warn("gemini.api.key is not set — using local fallback ModerationService. Set GEMINI_API_KEY to enable Gemini moderation.");

            return new ModerationService() {
                @Override
                public BatchModerationResponse analyzeContents(List<String> contents, String tags) {
                    List<String> result = contents.stream().map(c -> "NORMAL").collect(Collectors.toList());
                    return BatchModerationResponse.builder().tags(result).build();
                }
            };
        }

        GoogleAiGeminiChatModel model = GoogleAiGeminiChatModel.builder()
                .apiKey(geminiApiKey)
                .modelName(geminiModelName)
                .temperature(geminiModelTemperature)
                .build();

        return AiServices.builder(ModerationService.class)
                .chatLanguageModel(model)
                .build();
    }
}
