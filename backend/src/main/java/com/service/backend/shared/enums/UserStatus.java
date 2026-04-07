package com.service.backend.shared.enums;

public enum UserStatus {
    ACTIVE("ACTIVE"),
    INACTIVE("INACTIVE"),
    BANNED("BANNED"),
    SUSPENDED("SUSPENDED"),
    DELETED("DELETED"),
    DISABLED("DISABLED"),
    PENDING("PENDING"),
    UNVERIFIED("UNVERIFIED");

    private final String status;

    UserStatus(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }
}