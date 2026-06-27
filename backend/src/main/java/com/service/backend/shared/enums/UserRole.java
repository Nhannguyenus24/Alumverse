package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum UserRole {
    ADMIN("ADMIN"),
    USER("USER"),
    STAFF("STAFF");

    private final String value;

    UserRole(String value) {
        this.value = value;
    }

}
