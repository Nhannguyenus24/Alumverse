package com.service.backend.shared.enums;

public enum AcademicStatus {
    GRADUATED("GRADUATED"),
    STUDYING("STUDYING"),
    DROPPED("DROPPED");

    private final String value;

    AcademicStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
