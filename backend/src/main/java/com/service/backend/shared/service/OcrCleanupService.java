package com.service.backend.shared.service;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;

public interface OcrCleanupService {

    @SystemMessage("""
        You are an OCR text cleaner AI.
        Your task is to take the raw OCR output from a document and remove any garbage, unreadable, or corrupted characters.
        Fix minor typos if they are obviously due to OCR scanning errors, but do NOT rewrite the content.
        Keep ONLY the actual, readable text content. Do not summarize or add any extra text or markdown formatting.
        Output just the cleaned text.
       """)
    String cleanOcrText(@UserMessage String rawText);
}
