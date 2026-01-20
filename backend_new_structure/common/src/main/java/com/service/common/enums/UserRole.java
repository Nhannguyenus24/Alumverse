package com.service.common.enums;

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

    public String getValue() {
        return value;
    }
}
