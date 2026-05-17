package com.service.backend.shared.enums;

import java.util.Arrays;
import java.util.stream.Collectors;

public enum ModerationTag {
    NORMAL("Safe and acceptable content"),
    SENSITIVE("Politics, violence, hate speech, or adult topics"),
    OFFENSIVE("Profanity, insults, cyberbullying, or toxic language");

    private final String description;

    ModerationTag(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public static String getAllTagsAsString() {
        return Arrays.stream(values())
                .map(Enum::name)
                .collect(Collectors.joining(", "));
    }
}
