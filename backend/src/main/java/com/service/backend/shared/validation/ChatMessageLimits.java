package com.service.backend.shared.validation;

/**
 * Chat message length limit, shared between the {@code @Size} constraint on the
 * REST first-message DTO and the WebSocket send path in
 * {@code ChatService.sendMessage} so both agree on the same character cap.
 */
public final class ChatMessageLimits {

    /** Maximum number of characters allowed in a chat message. */
    public static final int MAX_MESSAGE_LENGTH = 200;

    private ChatMessageLimits() {
    }

    /** True when {@code value} is longer than {@link #MAX_MESSAGE_LENGTH} characters. */
    public static boolean exceedsMax(String value) {
        return value != null && value.length() > MAX_MESSAGE_LENGTH;
    }
}
