package com.service.backend.shared.enums;

public enum UserRole {
    admin("admin"),
    student("student"),
    alumni("alumni"),
    staff("staff"),
    guest("guest");

    private final String value;

    UserRole(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
