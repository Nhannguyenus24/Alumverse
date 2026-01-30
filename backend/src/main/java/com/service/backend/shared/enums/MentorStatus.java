package com.service.backend.shared.enums;

public enum MentorStatus {
    AVAILABLE("available"),
    BUSY("busy"),
    OFFLINE("offline");

    private final String value;

    MentorStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
