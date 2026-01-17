package com.service.backend.domain.enums;

public enum ItemType {
    NEWS("News"),
    EVENT("Event"),
    JOB("Job"),
    RESOURCE("Resource");

    private final String value;

    ItemType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
