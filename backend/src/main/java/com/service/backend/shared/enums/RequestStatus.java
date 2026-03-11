package com.service.backend.shared.enums;

public enum RequestStatus {
    pending("pending"),
    approved("approved"),
    rejected("rejected");

    private final String value;

    RequestStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
