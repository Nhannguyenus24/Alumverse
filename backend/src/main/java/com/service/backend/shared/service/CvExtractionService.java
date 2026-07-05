package com.service.backend.shared.service;

import com.service.backend.shared.dto.CvExtractionResponse;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;

/**
 * AI service that parses the raw text extracted from a mentor's uploaded CV
 * (via OCRService) into structured fields for the signup form's "profile"
 * step. Reuses the same Gemini chat model wired for moderation/OCR cleanup.
 */
public interface CvExtractionService {

    @SystemMessage("""
        You extract structured resume/CV fields from raw text (already OCR'd, may
        contain minor noise). The output fills a mentor signup form automatically,
        so the user can review and edit it — extract what is clearly present, do
        NOT invent information that isn't in the text.

        RULES:
        1. Respond ONLY with a single JSON object matching this shape:
           {
             "currentJobTitle": string | null,
             "currentCompany": string | null,
             "bio": string | null,
             "educations": [{"school": string, "degree": string, "period": string}],
             "experiences": [{"title": string, "company": string, "period": string, "description": string}],
             "projects": [{"name": string, "description": string, "link": string}],
             "awards": [{"name": string, "year": string, "description": string}],
             "skills": [{"name": string, "issuer": string}]
           }
        2. "currentJobTitle"/"currentCompany" are the person's MOST RECENT role and
           employer (first/most recent entry in the work experience section).
        3. "bio" is a short 2-4 sentence professional summary. If the CV has an
           explicit "Summary"/"About" section, use and lightly clean it; otherwise
           synthesize one from the experience/education present.
        4. "period" fields are free text as found (e.g. "2019 - 2023", "06/2021 - Present").
        5. "skills[].issuer" is the certifying body/platform if present (e.g.
           "Coursera", "AWS"), otherwise null.
        6. Omit sections entirely (empty array) rather than guessing when there is
           no matching content in the text. Never fabricate schools, companies, or
           dates that are not in the source text.
        7. No markdown, no explanations, no extra fields — JSON only.
       """)
    CvExtractionResponse extractProfile(@UserMessage String cvText);
}
