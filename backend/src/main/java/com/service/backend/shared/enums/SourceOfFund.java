package com.service.backend.shared.enums;

public enum SourceOfFund {
    momo("momo"),
    bank("bank");

    private final String value;

    SourceOfFund(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
