package com.service.backend.fitbot.dto;

import java.util.List;
import java.util.Map;

public record FitBotRetrieveResponse(
        String prompt,
        List<Map<String, Object>> sources
) {
}
