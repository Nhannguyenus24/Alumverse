package com.service.backend.shared.enums;

public enum AccountStatus {
    ACTIVE("Active"),
    PENDING("Pending"),
    BANNED("Banned");

    private final String value;

    AccountStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
