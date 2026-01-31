package com.service.backend.shared.enums;

public enum ResourceType {
    COURSE("course"),
    EBOOK("ebook"),
    VIDEO("video");

    private final String value;

    ResourceType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
