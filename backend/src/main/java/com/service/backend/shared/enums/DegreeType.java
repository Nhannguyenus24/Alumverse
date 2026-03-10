package com.service.backend.shared.enums;

public enum DegreeType {
    high_school("high school"),
    associate("associate"),
    bachelor("bachelor"),
    master("master"),
    doctorate("doctorate");

    private final String value;

    DegreeType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
