package com.service.backend.shared.service;

import com.service.backend.shared.dto.SkillTagsResponse;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Heuristic, no-AI fallback for {@link SkillExtractionService} (ME-02). Used
 * when no Gemini API key is configured so the feature still works in local /
 * test environments. Splits the description on common separators and keeps
 * short, distinct phrases as candidate tags.
 */
public final class SkillExtractionFallback {

    private SkillExtractionFallback() {
    }

    private static final int MAX_TAGS = 10;
    private static final int MAX_WORDS_PER_TAG = 5;

    public static SkillTagsResponse extract(String description) {
        List<String> tags = new ArrayList<>();
        if (description != null && !description.isBlank()) {
            String[] parts = description.split("[,;\\n\\r•·/|]|\\s+và\\s+|\\s+and\\s+");
            Map<String, String> seen = new LinkedHashMap<>();
            for (String raw : parts) {
                String phrase = raw.trim().replaceAll("\\s+", " ");
                if (phrase.isEmpty()) {
                    continue;
                }
                int words = phrase.split(" ").length;
                if (words == 0 || words > MAX_WORDS_PER_TAG || phrase.length() > 60) {
                    continue;
                }
                String key = phrase.toLowerCase(Locale.ROOT);
                seen.putIfAbsent(key, phrase);
                if (seen.size() >= MAX_TAGS) {
                    break;
                }
            }
            tags.addAll(seen.values());
        }
        return SkillTagsResponse.builder().tags(tags).build();
    }
}
