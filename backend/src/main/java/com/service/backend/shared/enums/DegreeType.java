package com.service.backend.shared.enums;

public enum DegreeType {
    HIGH_SCHOOL("high school"),
    ASSOCIATE("associate"),
    BACHELOR("bachelor"),
    MASTER("master"),
    DOCTORATE("doctorate");

    private final String value;

    DegreeType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
