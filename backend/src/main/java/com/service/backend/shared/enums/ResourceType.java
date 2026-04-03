package com.service.backend.shared.enums;

public enum ResourceType {
    COURSE("COURSE"),
    EBOOK("EBOOK"),
    VIDEO("VIDEO");

    private final String value;

    ResourceType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
