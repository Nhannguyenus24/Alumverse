package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum MentorshipSessionType {
    CAREER("CAREER"),
    ACADEMIC("ACADEMIC"),
    SOFT_SKILLS("SOFT_SKILLS");

    private final String value;

    MentorshipSessionType(String value) {
        this.value = value;
    }
}
