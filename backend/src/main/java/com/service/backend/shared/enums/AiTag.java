package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum AiTag {
    UNVERIFIED("UNVERIFIED"),
    VERIFIED("VERIFIED"),
    VIOLATED("VIOLATED");

    private final String value;

    AiTag(String value) {
        this.value = value;
    }
}
