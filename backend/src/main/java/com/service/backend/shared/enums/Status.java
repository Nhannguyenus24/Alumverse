package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum Status {
    PENDING("PENDING"),
    APPROVED("APPROVED"),
    REJECTED("REJECTED"),
    ACTIVE("ACTIVE"),
    INACTIVE("INACTIVE"),
    SUSPENDED("SUSPENDED"),
    CONFIRMED("CONFIRMED"),
    COMPLETED("COMPLETED"),
    CANCELLED("CANCELLED"),
    DRAFT("DRAFT"),
    NEED_UPDATE("NEED_UPDATE"),
    SUCCESS("SUCCESS"),
    REGISTERED("REGISTERED"),
    CHECKED_IN("CHECKED_IN"),
    ACCEPTED("ACCEPTED"),
    GRADUATED("GRADUATED"),
    STUDYING("STUDYING"),
    DROPPED("DROPPED"),
    BANNED("BANNED"),
    DELETED("DELETED"),
    DISABLED("DISABLED"),
    UNVERIFIED("UNVERIFIED"),
    AVAILABLE("AVAILABLE"),
    BOOKED("BOOKED");

    private final String value;

    Status(String value) {
        this.value = value;
    }
}
