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

            return (contents, tags) -> {
                List<String> result = contents.stream().map(c -> "NORMAL").collect(Collectors.toList());
                return BatchModerationResponse.builder().tags(result).build();
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

    @Bean
    public com.service.backend.shared.service.OcrCleanupService ocrCleanupService() {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return rawText -> rawText;
        }

        GoogleAiGeminiChatModel model = GoogleAiGeminiChatModel.builder()
                .apiKey(geminiApiKey)
                .modelName(geminiModelName)
                .temperature(geminiModelTemperature)
                .build();

        return AiServices.builder(com.service.backend.shared.service.OcrCleanupService.class)
                .chatLanguageModel(model)
                .build();
    }

    @Bean
    public com.service.backend.shared.service.SkillExtractionService skillExtractionService() {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            // No Gemini key: fall back to a local heuristic so ME-02 still works.
            return com.service.backend.shared.service.SkillExtractionFallback::extract;
        }

        GoogleAiGeminiChatModel model = GoogleAiGeminiChatModel.builder()
                .apiKey(geminiApiKey)
                .modelName(geminiModelName)
                .temperature(geminiModelTemperature)
                .build();

        return AiServices.builder(com.service.backend.shared.service.SkillExtractionService.class)
                .chatLanguageModel(model)
                .build();
    }

    @Bean
    public com.service.backend.shared.service.CvExtractionService cvExtractionService() {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            // No Gemini key: return an empty result so the CV-upload step degrades
            // to a no-op instead of failing the request.
            return cvText -> com.service.backend.shared.dto.CvExtractionResponse.builder().build();
        }

        GoogleAiGeminiChatModel model = GoogleAiGeminiChatModel.builder()
                .apiKey(geminiApiKey)
                .modelName(geminiModelName)
                .temperature(geminiModelTemperature)
                .build();

        return AiServices.builder(com.service.backend.shared.service.CvExtractionService.class)
                .chatLanguageModel(model)
                .build();
    }
}
