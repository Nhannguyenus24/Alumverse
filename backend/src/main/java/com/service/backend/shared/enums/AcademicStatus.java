package com.service.backend.shared.enums;

public enum AcademicStatus {
    GRADUATED("graduated"),
    STUDYING("studying"),
    DROPPED("dropped");

    private final String value;

    AcademicStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
