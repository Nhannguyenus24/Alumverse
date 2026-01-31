package com.service.backend.shared.enums;

public enum UserRole {
    ADMIN("admin"),
    STUDENT("student"),
    ALUMNI("alumni"),
    STAFF("staff"),
    GUEST("guest");

    private final String value;

    UserRole(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
