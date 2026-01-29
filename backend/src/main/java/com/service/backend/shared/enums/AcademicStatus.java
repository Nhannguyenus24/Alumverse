package com.service.backend.shared.enums;

public enum AcademicStatus {
    GRADUATED("Graduated"),
    STUDYING("Studying"),
    DROPPED("Dropped");

    private final String value;

    AcademicStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
