package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum QuestionType {
    SHORT_TEXT("SHORT_TEXT"),
    SINGLE_CHOICE("SINGLE_CHOICE"),
    MULTI_CHOICE("MULTI_CHOICE"),
    DATE("DATE"),
    NUMBER("NUMBER"),
    RATING("RATING");

    private final String value;

    QuestionType(String value) {
        this.value = value;
    }

    public static QuestionType fromValue(String value) {
        if (value == null) return null;
        for (QuestionType type : values()) {
            if (type.value.equalsIgnoreCase(value) || type.name().equalsIgnoreCase(value)) {
                return type;
            }
        }
        return null;
    }
}
