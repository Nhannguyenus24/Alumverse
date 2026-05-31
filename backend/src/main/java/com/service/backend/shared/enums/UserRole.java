package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum UserRole {
    ADMIN("ADMIN"),
    STUDENT("STUDENT"),
    ALUMNI("ALUMNI"),
    STAFF("STAFF"),
    GUEST("GUEST");

    private final String value;

    UserRole(String value) {
        this.value = value;
    }

}
