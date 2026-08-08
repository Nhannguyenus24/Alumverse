package com.service.backend.config.ai;

import dev.langchain4j.agent.tool.ToolSpecification;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.output.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;

public class FailoverChatModel implements ChatLanguageModel {

    private static final Logger log = LoggerFactory.getLogger(FailoverChatModel.class);

    /** Một mắt xích trong chuỗi: model kèm provider sở hữu key của nó. */
    public record Delegate(Integer providerId, ChatLanguageModel model) {
    }

    private final List<Delegate> delegates;
    private final Consumer<Integer> onQuotaExhausted;

    public FailoverChatModel(List<Delegate> delegates, Consumer<Integer> onQuotaExhausted) {
        if (delegates == null || delegates.isEmpty()) {
            throw new IllegalArgumentException("FailoverChatModel needs at least one delegate model");
        }
        this.delegates = List.copyOf(delegates);
        this.onQuotaExhausted = onQuotaExhausted;
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
            Delegate delegate = delegates.get(i);
            try {
                return call.apply(delegate.model());
            } catch (RuntimeException e) {
                last = e;
                if (isQuotaError(e)) {
                    notifyQuotaExhausted(delegate.providerId());
                }
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

    private void notifyQuotaExhausted(Integer providerId) {
        if (onQuotaExhausted == null || providerId == null) {
            return;
        }
        try {
            onQuotaExhausted.accept(providerId);
        } catch (RuntimeException e) {
            log.warn("Failed to record quota-exhausted state for provider {}", providerId, e);
        }
    }

    /** Lỗi hết quota/rate-limit — đáng đánh dấu provider cooldown, chờ health-check hồi phục. */
    private boolean isQuotaError(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            String msg = t.getMessage();
            if (msg != null) {
                String m = msg.toLowerCase();
                if (m.contains("429")
                        || m.contains("resource_exhausted")
                        || m.contains("quota")
                        || m.contains("rate limit")
                        || m.contains("rate-limit")
                        || m.contains("too many requests")) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean isRetryable(Throwable e) {
        if (isQuotaError(e)) {
            return true;
        }
        for (Throwable t = e; t != null; t = t.getCause()) {
            String msg = t.getMessage();
            if (msg != null) {
                String m = msg.toLowerCase();
                if (m.contains("overloaded")
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
