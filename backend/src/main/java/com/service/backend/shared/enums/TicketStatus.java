package com.service.backend.shared.enums;

public enum TicketStatus {
    REGISTERED("Registered"),
    CHECKED_IN("Checked_in"),
    CANCELLED("Cancelled");

    private final String value;

    TicketStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
