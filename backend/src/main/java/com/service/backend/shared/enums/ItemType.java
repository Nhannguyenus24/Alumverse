package com.service.backend.shared.enums;

public enum ItemType {
    NEWS("NEWS"),
    EVENT("EVENT"),
    JOB("JOB"),
    RESOURCE("RESOURCE");

    private final String value;

    ItemType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
