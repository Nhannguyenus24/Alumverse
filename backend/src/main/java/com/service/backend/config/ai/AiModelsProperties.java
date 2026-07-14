package com.service.backend.config.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "ai")
public class AiModelsProperties {

    /** Danh sách model theo thứ tự ưu tiên; model[0] được thử trước. */
    private List<ModelSpec> models = new ArrayList<>();

    public List<ModelSpec> getModels() {
        return models;
    }

    public void setModels(List<ModelSpec> models) {
        this.models = models;
    }

    public static class ModelSpec {
        private String provider = "gemini";
        private String model;
        private String apiKey;
        private Double temperature;

        public String getProvider() {
            return provider;
        }

        public void setProvider(String provider) {
            this.provider = provider;
        }

        public String getModel() {
            return model;
        }

        public void setModel(String model) {
            this.model = model;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public Double getTemperature() {
            return temperature;
        }

        public void setTemperature(Double temperature) {
            this.temperature = temperature;
        }

        public boolean hasKey() {
            return apiKey != null && !apiKey.isBlank() && model != null && !model.isBlank();
        }
    }
}
