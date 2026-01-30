package com.service.backend.shared.enums;

public enum UserStatus {
    ACTIVE("active"),
    INACTIVE("inactive"),
    BANNED("banned"),
    SUSPENDED("suspended"),
    DELETED("deleted"),
    DISABLED("disabled"),
    PENDING("pending"),
    UNVERIFIED("unverified");

    private final String status;

    UserStatus(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }
}