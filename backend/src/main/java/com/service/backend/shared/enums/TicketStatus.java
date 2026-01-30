package com.service.backend.shared.enums;

public enum TicketStatus {
    REGISTERED("registered"),
    CHECKED_IN("checked_in"),
    CANCELLED("cancelled");

    private final String value;

    TicketStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
