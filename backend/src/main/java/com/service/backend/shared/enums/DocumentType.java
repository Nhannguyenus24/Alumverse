package com.service.backend.shared.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum DocumentType {
    PDF("PDF"),
    IMAGE("IMAGE"),
    PNG("PNG"),
    JPEG("JPEG"),
    TXT("TXT"),
    STUDENT_ID("STUDENT_ID"),
    GRADUATION_CERTIFICATE("GRADUATION_CERTIFICATE"),
    DIPLOMA("DIPLOMA");

    private final String value;

    DocumentType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static DocumentType fromString(String value) {
        if (value == null) return null;
        for (DocumentType type : DocumentType.values()) {
            if (type.name().equalsIgnoreCase(value) || type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        return null;
    }
}
