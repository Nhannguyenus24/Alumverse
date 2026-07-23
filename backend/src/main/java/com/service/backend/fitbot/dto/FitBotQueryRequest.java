package com.service.backend.fitbot.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record FitBotQueryRequest(
        @NotBlank String question,
        @JsonProperty("top_k") @Min(1) @Max(20) Integer topK,
        @JsonProperty("use_reranker") Boolean useReranker
) {
    public int resolvedTopK() {
        return topK == null ? 10 : topK;
    }

    public boolean resolvedUseReranker() {
        return Boolean.TRUE.equals(useReranker);
    }
}
