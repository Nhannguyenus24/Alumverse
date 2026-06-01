package com.service.backend.shared.service;

import com.service.backend.shared.dto.BatchModerationResponse;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import java.util.List;

public interface ModerationService {

    @SystemMessage("""
        You are an expert content moderation AI system.\s
        Analyze the list of text contents and classify each into exactly one of these tags: {{tags}}.
       \s
        CRITICAL:
        1. Respond ONLY with a JSON object containing a field 'tags' which is a list of strings.
        2. The 'tags' list must have the EXACT same size and order as the input list.
        3. No explanations, no markdown.
       \s""")
    BatchModerationResponse analyzeContents(@UserMessage List<String> contents, @V("tags") String tags);
}
