package com.service.backend.shared.enums;

public enum AccountStatus {
    ACTIVE("active"),
    PENDING("pending"),
    BANNED("banned");

    private final String value;

    AccountStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
