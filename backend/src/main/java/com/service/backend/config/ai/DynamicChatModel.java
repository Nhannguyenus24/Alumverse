package com.service.backend.config.ai;

import dev.langchain4j.agent.tool.ToolSpecification;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.output.Response;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;

@Component
public class DynamicChatModel implements ChatLanguageModel {

    private final AtomicReference<ChatLanguageModel> delegate = new AtomicReference<>();
    private final MeterRegistry meterRegistry;

    public DynamicChatModel(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

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
        return timed(() -> current().generate(messages));
    }

    @Override
    public Response<AiMessage> generate(ChatMessage... messages) {
        return timed(() -> current().generate(messages));
    }

    @Override
    public Response<AiMessage> generate(List<ChatMessage> messages, List<ToolSpecification> toolSpecifications) {
        return timed(() -> current().generate(messages, toolSpecifications));
    }

    @Override
    public Response<AiMessage> generate(List<ChatMessage> messages, ToolSpecification toolSpecification) {
        return timed(() -> current().generate(messages, toolSpecification));
    }

    /** Đo latency của mọi lời gọi LLM (choke point duy nhất cho tất cả AI features). */
    private Response<AiMessage> timed(Supplier<Response<AiMessage>> call) {
        Timer.Sample sample = Timer.start(meterRegistry);
        String outcome = "success";
        try {
            return call.get();
        } catch (RuntimeException e) {
            outcome = "error";
            throw e;
        } finally {
            sample.stop(Timer.builder("ai.generate.time")
                    .description("AI chat model generate latency")
                    .tag("outcome", outcome)
                    .publishPercentiles(0.5, 0.95, 0.99)
                    .publishPercentileHistogram(true)
                    .register(meterRegistry));
            meterRegistry.counter("ai.generate.count", "outcome", outcome).increment();
        }
    }

    public static class AiUnavailableException extends RuntimeException {
        public AiUnavailableException(String message) {
            super(message);
        }
    }
}
