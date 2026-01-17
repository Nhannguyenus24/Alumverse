package com.service.backend.domain.enums;

public enum MentorStatus {
    AVAILABLE("Available"),
    BUSY("Busy"),
    OFFLINE("Offline");

    private final String value;

    MentorStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
