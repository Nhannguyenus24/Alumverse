package com.service.backend.domain.enums;

public enum DegreeType {
    HIGH_SCHOOL("High School"),
    ASSOCIATE("Associate"),
    BACHELOR("Bachelor"),
    MASTER("Master"),
    DOCTORATE("Doctorate");

    private final String value;

    DegreeType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
