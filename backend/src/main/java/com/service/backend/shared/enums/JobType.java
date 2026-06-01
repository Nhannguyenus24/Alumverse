package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum JobType {
    FULL_TIME("FULL_TIME"),
    PART_TIME("PART_TIME"),
    INTERNSHIP("INTERNSHIP"),
    CONTRACT("CONTRACT"),
    FREELANCE("FREELANCE");

    private final String value;

    JobType(String value) {
        this.value = value;
    }
}
