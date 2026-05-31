package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum AcademicStatus {
    GRADUATED("GRADUATED"),
    STUDYING("STUDYING"),
    DROPPED("DROPPED");

    private final String value;

    AcademicStatus(String value) {
        this.value = value;
    }

}
