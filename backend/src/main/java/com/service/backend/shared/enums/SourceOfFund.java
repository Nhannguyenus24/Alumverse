package com.service.backend.shared.enums;

public enum SourceOfFund {
    MOMO("MOMO"),
    BANK("BANK");

    private final String value;

    SourceOfFund(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
