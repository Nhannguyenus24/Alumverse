package com.service.backend.config;

import com.service.backend.config.ai.DynamicChatModel;
import com.service.backend.shared.dto.BatchModerationResponse;
import com.service.backend.shared.dto.CvExtractionResponse;
import com.service.backend.shared.service.CvExtractionService;
import com.service.backend.shared.service.ModerationService;
import com.service.backend.shared.service.OcrCleanupService;
import com.service.backend.shared.service.SkillExtractionFallback;
import com.service.backend.shared.service.SkillExtractionService;
import com.service.backend.shared.service.SurveyInsightService;
import dev.langchain4j.service.AiServices;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.stream.Collectors;

@Configuration
public class LangChain4jConfig {

    private static final Logger log = LoggerFactory.getLogger(LangChain4jConfig.class);

    private final DynamicChatModel chatModel;

    public LangChain4jConfig(DynamicChatModel chatModel) {
        this.chatModel = chatModel;
    }

    private <T> T aiDelegate(Class<T> serviceType) {
        return AiServices.builder(serviceType)
                .chatLanguageModel(chatModel)
                .build();
    }

    @Bean
    public ModerationService moderationService() {
        ModerationService ai = aiDelegate(ModerationService.class);
        return (contents, tags) -> {
            try {
                return ai.analyzeContents(contents, tags);
            } catch (RuntimeException e) {
                log.warn("Moderation AI unavailable, defaulting all to NORMAL: {}", e.getMessage());
                List<String> result = contents.stream().map(c -> "NORMAL").collect(Collectors.toList());
                return BatchModerationResponse.builder().tags(result).build();
            }
        };
    }

    @Bean
    public OcrCleanupService ocrCleanupService() {
        OcrCleanupService ai = aiDelegate(OcrCleanupService.class);
        return rawText -> {
            try {
                return ai.cleanOcrText(rawText);
            } catch (RuntimeException e) {
                log.warn("OCR-cleanup AI unavailable, returning raw text: {}", e.getMessage());
                return rawText;
            }
        };
    }

    @Bean
    public SkillExtractionService skillExtractionService() {
        SkillExtractionService ai = aiDelegate(SkillExtractionService.class);
        return text -> {
            try {
                return ai.extractTags(text);
            } catch (RuntimeException e) {
                log.warn("Skill-extraction AI unavailable, using local heuristic: {}", e.getMessage());
                return SkillExtractionFallback.extract(text);
            }
        };
    }

    @Bean
    public SurveyInsightService surveyInsightService() {
        SurveyInsightService ai = aiDelegate(SurveyInsightService.class);
        return summaryJson -> {
            try {
                return ai.summarize(summaryJson);
            } catch (RuntimeException e) {
                log.warn("Survey-insight AI unavailable, returning placeholder: {}", e.getMessage());
                return "Chưa cấu hình khóa AI. Vui lòng xem phần tổng hợp số liệu để tự phân tích.";
            }
        };
    }

    @Bean
    public CvExtractionService cvExtractionService() {
        CvExtractionService ai = aiDelegate(CvExtractionService.class);
        return cvText -> {
            try {
                return ai.extractProfile(cvText);
            } catch (RuntimeException e) {
                log.warn("CV-extraction AI unavailable, returning empty result: {}", e.getMessage());
                return CvExtractionResponse.builder().build();
            }
        };
    }
}
