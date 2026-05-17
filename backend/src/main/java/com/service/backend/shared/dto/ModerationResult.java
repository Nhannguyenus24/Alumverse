package com.service.backend.shared.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModerationResult {
    private String tag; // SENSITIVE, OFFENSIVE, NORMAL
    private String reason; // Brief explanation in Vietnamese
}
