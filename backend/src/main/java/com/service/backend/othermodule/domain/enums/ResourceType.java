package com.service.backend.othermodule.domain.enums;

public enum ResourceType {
    COURSE("Course"),
    EBOOK("Ebook"),
    VIDEO("Video");

    private final String value;

    ResourceType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
