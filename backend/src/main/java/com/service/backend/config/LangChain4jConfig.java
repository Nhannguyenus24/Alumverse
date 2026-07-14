package com.service.backend.config;

import com.service.backend.config.ai.AiModelFactory;
import com.service.backend.config.ai.FailoverChatModel;
import com.service.backend.shared.dto.BatchModerationResponse;
import com.service.backend.shared.service.CvExtractionService;
import com.service.backend.shared.service.ModerationService;
import com.service.backend.shared.service.OcrCleanupService;
import com.service.backend.shared.service.SkillExtractionFallback;
import com.service.backend.shared.service.SkillExtractionService;
import com.service.backend.shared.service.SurveyInsightService;
import com.service.backend.shared.dto.CvExtractionResponse;
import dev.langchain4j.model.chat.ChatLanguageModel;
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

    private final ChatLanguageModel chatModel;

    public LangChain4jConfig(AiModelFactory aiModelFactory) {
        List<ChatLanguageModel> chain = aiModelFactory.buildChain();
        this.chatModel = chain.isEmpty() ? null : new FailoverChatModel(chain);
        if (this.chatModel == null) {
            log.warn("No AI model configured — AI services will use local fallbacks.");
        }
    }

    private <T> T aiService(Class<T> serviceType) {
        return AiServices.builder(serviceType)
                .chatLanguageModel(chatModel)
                .build();
    }

    @Bean
    public ModerationService moderationService() {
        if (chatModel == null) {
            return (contents, tags) -> {
                List<String> result = contents.stream().map(c -> "NORMAL").collect(Collectors.toList());
                return BatchModerationResponse.builder().tags(result).build();
            };
        }
        return aiService(ModerationService.class);
    }

    @Bean
    public OcrCleanupService ocrCleanupService() {
        if (chatModel == null) {
            return rawText -> rawText;
        }
        return aiService(OcrCleanupService.class);
    }

    @Bean
    public SkillExtractionService skillExtractionService() {
        if (chatModel == null) {
            // No AI model: fall back to a local heuristic so ME-02 still works.
            return SkillExtractionFallback::extract;
        }
        return aiService(SkillExtractionService.class);
    }

    @Bean
    public SurveyInsightService surveyInsightService() {
        if (chatModel == null) {
            // No AI model: return a neutral placeholder so the insight endpoint still works.
            return summaryJson ->
                    "Chưa cấu hình khóa AI (GEMINI_API_KEY). Vui lòng xem phần tổng hợp số liệu để tự phân tích.";
        }
        return aiService(SurveyInsightService.class);
    }

    @Bean
    public CvExtractionService cvExtractionService() {
        if (chatModel == null) {
            return cvText -> CvExtractionResponse.builder().build();
        }
        return aiService(CvExtractionService.class);
    }
}
