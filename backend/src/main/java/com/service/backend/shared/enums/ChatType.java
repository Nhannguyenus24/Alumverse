package com.service.backend.shared.enums;

public enum ChatType {
    PRIVATE("PRIVATE"),
    GROUP("GROUP");

    private final String value;

    ChatType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
