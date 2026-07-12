package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum ChatType {
    PRIVATE("PRIVATE"),
    GROUP("GROUP");

    private final String value;

    ChatType(String value) {
        this.value = value;
    }

}
