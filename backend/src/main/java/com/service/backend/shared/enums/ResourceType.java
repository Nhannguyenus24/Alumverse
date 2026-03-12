package com.service.backend.shared.enums;

public enum ResourceType {
    course("course"),
    ebook("ebook"),
    video("video");

    private final String value;

    ResourceType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
