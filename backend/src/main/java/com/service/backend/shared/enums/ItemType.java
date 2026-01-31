package com.service.backend.shared.enums;

public enum ItemType {
    NEWS("news"),
    EVENT("event"),
    JOB("job"),
    RESOURCE("resource");

    private final String value;

    ItemType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
