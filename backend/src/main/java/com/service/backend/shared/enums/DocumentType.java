package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum DocumentType {
    PDF("PDF"),
    IMAGE("IMAGE"),
    PNG("PNG"),
    JPEG("JPEG"),
    TXT("TXT");

    private final String value;

    DocumentType(String value) {
        this.value = value;
    }
}
