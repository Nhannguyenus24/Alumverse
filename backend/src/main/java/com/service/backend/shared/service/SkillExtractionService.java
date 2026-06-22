package com.service.backend.shared.service;

import com.service.backend.shared.dto.SkillTagsResponse;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;

/**
 * AI service (ME-02) that extracts concise skill / expertise tags from a
 * free-text description supplied by a mentor or mentee during signup. Reuses
 * the same Gemini chat model wired for moderation/OCR cleanup.
 */
public interface SkillExtractionService {

    @SystemMessage("""
        You extract concise, hashtag-style skill keywords from a person's free-text
        description of their experience (for a mentor) or learning needs (for a mentee).
        The keywords are used as filter tags, so they must be normalized — not raw
        phrases copied from the sentence.

        RULES:
        1. Respond ONLY with a JSON object with a field 'tags' that is a list of strings.
        2. Each tag is ONE keyword with NO spaces. For a multi-word concept use
           snake_case (e.g. "mock_interview", "system_design").
        3. Normalize to the common/standard name of the skill. Prefer the widely-used
           technical term, usually English (e.g. "backend Java Spring" -> "Java",
           "SpringBoot", "backend"; "phỏng vấn" -> "mock_interview"; "hướng dẫn thực
           tập sinh" -> "mentoring"). Do not include generic filler words.
        4. Return at most 10 tags, no duplicates, no leading '#', no explanations, no markdown.
        5. If no meaningful skill can be found, return {"tags": []}.

        Example Input:
        "Mình có 5 năm backend Java Spring, từng phỏng vấn và hướng dẫn thực tập sinh."

        Example Output:
        {"tags": ["Java", "SpringBoot", "backend", "mock_interview", "mentoring"]}
       """)
    SkillTagsResponse extractTags(@UserMessage String description);
}
