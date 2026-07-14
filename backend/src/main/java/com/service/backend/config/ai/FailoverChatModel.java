package com.service.backend.config.ai;

import dev.langchain4j.agent.tool.ToolSpecification;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.output.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.function.Function;

public class FailoverChatModel implements ChatLanguageModel {

    private static final Logger log = LoggerFactory.getLogger(FailoverChatModel.class);

    private final List<ChatLanguageModel> delegates;

    public FailoverChatModel(List<ChatLanguageModel> delegates) {
        if (delegates == null || delegates.isEmpty()) {
            throw new IllegalArgumentException("FailoverChatModel needs at least one delegate model");
        }
        this.delegates = List.copyOf(delegates);
    }

    @Override
    public Response<AiMessage> generate(List<ChatMessage> messages) {
        return attempt(model -> model.generate(messages));
    }

    @Override
    public Response<AiMessage> generate(ChatMessage... messages) {
        return attempt(model -> model.generate(messages));
    }

    @Override
    public Response<AiMessage> generate(List<ChatMessage> messages, List<ToolSpecification> toolSpecifications) {
        return attempt(model -> model.generate(messages, toolSpecifications));
    }

    @Override
    public Response<AiMessage> generate(List<ChatMessage> messages, ToolSpecification toolSpecification) {
        return attempt(model -> model.generate(messages, toolSpecification));
    }

    private Response<AiMessage> attempt(Function<ChatLanguageModel, Response<AiMessage>> call) {
        RuntimeException last = null;
        for (int i = 0; i < delegates.size(); i++) {
            ChatLanguageModel model = delegates.get(i);
            try {
                return call.apply(model);
            } catch (RuntimeException e) {
                last = e;
                boolean hasNext = i < delegates.size() - 1;
                if (hasNext && isRetryable(e)) {
                    log.warn("AI model #{} failed ({}), trying next model in chain.", i, describe(e));
                    continue;
                }
                throw e;
            }
        }
        throw last != null ? last : new IllegalStateException("No AI model available");
    }

    private boolean isRetryable(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            String msg = t.getMessage();
            if (msg != null) {
                String m = msg.toLowerCase();
                if (m.contains("429")
                        || m.contains("resource_exhausted")
                        || m.contains("quota")
                        || m.contains("rate limit")
                        || m.contains("rate-limit")
                        || m.contains("too many requests")
                        || m.contains("overloaded")
                        || m.contains("unavailable")
                        || m.contains("503")
                        || m.contains("500")
                        || m.contains("timeout")
                        || m.contains("timed out")) {
                    return true;
                }
            }
        }
        return false;
    }

    private String describe(Throwable e) {
        String msg = e.getMessage();
        String shortMsg = msg == null ? e.getClass().getSimpleName()
                : (msg.length() > 200 ? msg.substring(0, 200) + "…" : msg);
        return e.getClass().getSimpleName() + ": " + shortMsg;
    }
}
