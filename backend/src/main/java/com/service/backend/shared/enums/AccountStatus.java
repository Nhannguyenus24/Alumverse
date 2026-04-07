package com.service.backend.shared.enums;

public enum AccountStatus {
    ACTIVE("ACTIVE"),
    PENDING("PENDING"),
    BANNED("BANNED");

    private final String value;

    AccountStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
