package com.service.backend.shared.enums;

public enum MentorStatus {
    available("available"),
    busy("busy"),
    offline("offline");

    private final String value;

    MentorStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
