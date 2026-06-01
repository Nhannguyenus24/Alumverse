package com.service.backend.shared.enums;

public enum TicketStatus {
    REGISTERED("REGISTERED"),
    CHECKED_IN("CHECKED_IN"),
    CANCELLED("CANCELLED");

    private final String value;

    TicketStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
