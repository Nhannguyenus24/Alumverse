package com.service.backend.shared.enums;

public enum ItemType {
    news("news"),
    event("event"),
    job("job"),
    resource("resource");

    private final String value;

    ItemType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
