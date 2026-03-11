package com.service.backend.shared.enums;

public enum UserStatus {
    active("active"),
    inactive("inactive"),
    banned("banned"),
    suspended("suspended"),
    deleted("deleted"),
    disabled("disabled"),
    pending("pending"),
    unverified("unverified");

    private final String status;

    UserStatus(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }
}