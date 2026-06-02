package com.service.backend.shared.enums;

public enum ConversationRequestStatus {
    PENDING("PENDING"),
    ACCEPTED("ACCEPTED"),
    REJECTED("REJECTED");

    private final String value;

    ConversationRequestStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}