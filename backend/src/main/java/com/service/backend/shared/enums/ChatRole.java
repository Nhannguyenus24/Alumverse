package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum ChatRole {
    OWNER("OWNER"),
    ADMIN("ADMIN"),
    MEMBER("MEMBER");

    private final String value;

    ChatRole(String value) {
        this.value = value;
    }
}
