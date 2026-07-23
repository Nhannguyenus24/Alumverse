package com.service.backend.fitbot.dto;

import java.util.List;
import java.util.Map;

public record FitBotQueryResponse(
        String answer,
        List<Map<String, Object>> sources
) {
}
