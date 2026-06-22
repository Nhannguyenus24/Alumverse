package com.service.backend.shared.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Structured result of AI skill-tag extraction (ME-02): a flat list of concise
 * skill / topic tags extracted from a free-text description.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillTagsResponse {
    private List<String> tags;
}
