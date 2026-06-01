package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum ChatMessageType {
    TEXT("TEXT"),
    IMAGE("IMAGE"),
    FILE("FILE"),
    SYSTEM("SYSTEM"),
    VIDEO("VIDEO");

    private final String value;

    ChatMessageType(String value) {
        this.value = value;
    }
}
