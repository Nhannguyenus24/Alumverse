package com.service.backend.shared.enums;

public enum MentorStatus {
    AVAILABLE("AVAILABLE"),
    BUSY("BUSY"),
    OFFLINE("OFFLINE");

    private final String value;

    MentorStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
