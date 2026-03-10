package com.service.backend.shared.enums;

public enum AccountStatus {
    active("active"),
    pending("pending"),
    banned("banned");

    private final String value;

    AccountStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
