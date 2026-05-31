package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
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

}