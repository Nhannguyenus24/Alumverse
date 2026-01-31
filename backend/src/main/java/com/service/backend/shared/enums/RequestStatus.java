package com.service.backend.shared.enums;

public enum RequestStatus {
    PENDING("pending"),
    APPROVED("approved"),
    REJECTED("rejected");

    private final String value;

    RequestStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
