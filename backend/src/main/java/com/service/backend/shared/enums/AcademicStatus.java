package com.service.backend.shared.enums;

public enum AcademicStatus {
    graduated("graduated"),
    studying("studying"),
    dropped("dropped");

    private final String value;

    AcademicStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
