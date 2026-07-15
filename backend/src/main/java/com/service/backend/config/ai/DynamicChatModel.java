package com.service.backend.config.ai;

import dev.langchain4j.agent.tool.ToolSpecification;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.output.Response;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

@Component
public class DynamicChatModel implements ChatLanguageModel {

    private final AtomicReference<ChatLanguageModel> delegate = new AtomicReference<>();

    public void reload(ChatLanguageModel newDelegate) {
        delegate.set(newDelegate);
    }

    public boolean isAvailable() {
        return delegate.get() != null;
    }

    private ChatLanguageModel current() {
        ChatLanguageModel d = delegate.get();
        if (d == null) {
            throw new AiUnavailableException("No AI model is configured");
        }
        return d;
    }

    @Override
    public Response<AiMessage> generate(List<ChatMessage> messages) {
        return current().generate(messages);
    }

    @Override
    public Response<AiMessage> generate(ChatMessage... messages) {
        return current().generate(messages);
    }

    @Override
    public Response<AiMessage> generate(List<ChatMessage> messages, List<ToolSpecification> toolSpecifications) {
        return current().generate(messages, toolSpecifications);
    }

    @Override
    public Response<AiMessage> generate(List<ChatMessage> messages, ToolSpecification toolSpecification) {
        return current().generate(messages, toolSpecification);
    }

    public static class AiUnavailableException extends RuntimeException {
        public AiUnavailableException(String message) {
            super(message);
        }
    }
}
