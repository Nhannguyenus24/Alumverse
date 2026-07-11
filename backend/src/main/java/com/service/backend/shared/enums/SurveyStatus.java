package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum SurveyStatus {
    DRAFT("DRAFT"),
    OPEN("OPEN"),
    CLOSED("CLOSED");

    private final String value;

    SurveyStatus(String value) {
        this.value = value;
    }

    public static SurveyStatus fromValue(String value) {
        if (value == null) return null;
        for (SurveyStatus status : values()) {
            if (status.value.equalsIgnoreCase(value) || status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        return null;
    }
}
