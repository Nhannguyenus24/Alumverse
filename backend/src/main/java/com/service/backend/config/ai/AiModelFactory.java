package com.service.backend.config.ai;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class AiModelFactory {

    private static final Logger log = LoggerFactory.getLogger(AiModelFactory.class);

    private static final String OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

    private final AiModelsProperties properties;

    @Value("${gemini.api.key:}")
    private String legacyGeminiApiKey;

    @Value("${gemini.model.name:gemini-2.5-flash-lite}")
    private String legacyGeminiModelName;

    @Value("${gemini.model.temperature:0.0}")
    private double legacyGeminiTemperature;

    public AiModelFactory(AiModelsProperties properties) {
        this.properties = properties;
    }

    public List<ChatLanguageModel> buildChain() {
        List<AiModelsProperties.ModelSpec> specs = resolveSpecs();
        List<ChatLanguageModel> chain = new ArrayList<>();

        for (AiModelsProperties.ModelSpec spec : specs) {
            if (!spec.hasKey()) {
                continue;
            }
            try {
                chain.add(build(spec));
                log.info("AI model chain: registered {} model '{}'", spec.getProvider(), spec.getModel());
            } catch (RuntimeException e) {
                log.warn("AI model chain: skipped {} model '{}' — {}",
                        spec.getProvider(), spec.getModel(), e.getMessage());
            }
        }

        if (chain.isEmpty()) {
            log.warn("AI model chain is empty — no ai.models[*] and no gemini.api.key configured. "
                    + "AI features will use their local fallbacks.");
        }
        return chain;
    }

    private List<AiModelsProperties.ModelSpec> resolveSpecs() {
        List<AiModelsProperties.ModelSpec> configured = new ArrayList<>();
        for (AiModelsProperties.ModelSpec spec : properties.getModels()) {
            if (spec != null && spec.hasKey()) {
                configured.add(spec);
            }
        }
        if (!configured.isEmpty()) {
            return configured;
        }

        // Backward-compat: chưa khai báo ai.models nhưng vẫn có gemini.api.key cũ.
        if (legacyGeminiApiKey != null && !legacyGeminiApiKey.isBlank()) {
            AiModelsProperties.ModelSpec legacy = new AiModelsProperties.ModelSpec();
            legacy.setProvider("gemini");
            legacy.setModel(legacyGeminiModelName);
            legacy.setApiKey(legacyGeminiApiKey);
            legacy.setTemperature(legacyGeminiTemperature);
            configured.add(legacy);
            log.info("AI model chain: no ai.models configured — falling back to legacy gemini.api.key ('{}').",
                    legacyGeminiModelName);
        }
        return configured;
    }

    private ChatLanguageModel build(AiModelsProperties.ModelSpec spec) {
        double temperature = spec.getTemperature() != null ? spec.getTemperature() : legacyGeminiTemperature;
        String provider = spec.getProvider() == null ? "gemini" : spec.getProvider().trim().toLowerCase();

        return switch (provider) {
            case "openrouter" -> OpenAiChatModel.builder()
                    .baseUrl(OPENROUTER_BASE_URL)
                    .apiKey(spec.getApiKey())
                    .modelName(spec.getModel())
                    .temperature(temperature)
                    .build();
            case "gemini" -> GoogleAiGeminiChatModel.builder()
                    .apiKey(spec.getApiKey())
                    .modelName(spec.getModel())
                    .temperature(temperature)
                    .build();
            default -> throw new IllegalArgumentException("Unknown AI provider: " + spec.getProvider());
        };
    }
}
