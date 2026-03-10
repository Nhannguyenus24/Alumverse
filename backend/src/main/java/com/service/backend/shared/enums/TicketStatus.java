package com.service.backend.shared.enums;

public enum TicketStatus {
    registered("registered"),
    checked_in("checked_in"),
    cancelled("cancelled");

    private final String value;

    TicketStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
