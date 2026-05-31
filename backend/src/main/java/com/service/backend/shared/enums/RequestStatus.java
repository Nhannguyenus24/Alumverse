package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum RequestStatus {
    PENDING("PENDING"),
    APPROVED("APPROVED"),
    REJECTED("REJECTED");

    private final String value;

    RequestStatus(String value) {
        this.value = value;
    }

}
