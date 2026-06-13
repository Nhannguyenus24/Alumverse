package com.service.backend.shared.enums;

import lombok.Getter;

import java.util.Arrays;

@Getter
public enum ReportReasonCategory {
    NO_SHOW("NO_SHOW"),
    LATE_OR_LEFT_EARLY("LATE_OR_LEFT_EARLY"),
    INAPPROPRIATE_BEHAVIOR("INAPPROPRIATE_BEHAVIOR"),
    OFF_TOPIC_UNPROFESSIONAL("OFF_TOPIC_UNPROFESSIONAL"),
    TECHNICAL_ISSUE("TECHNICAL_ISSUE"),
    OTHER("OTHER");

    private final String value;

    ReportReasonCategory(String value) {
        this.value = value;
    }

    public static boolean isValid(String value) {
        if (value == null) return false;
        return Arrays.stream(values()).anyMatch(r -> r.value.equals(value));
    }
}
