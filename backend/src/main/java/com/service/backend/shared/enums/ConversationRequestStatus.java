package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum ConversationRequestStatus {
    PENDING("PENDING"),
    ACCEPTED("ACCEPTED"),
    REJECTED("REJECTED"),
    DISCONNECTED("DISCONNECTED");

    private final String value;

    ConversationRequestStatus(String value) {
        this.value = value;
    }

}
