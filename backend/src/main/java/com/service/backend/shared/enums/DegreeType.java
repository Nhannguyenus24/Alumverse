package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum DegreeType {
    HIGH_SCHOOL("HIGH SCHOOL"),
    ASSOCIATE("ASSOCIATE"),
    BACHELOR("BACHELOR"),
    MASTER("MASTER"),
    DOCTORATE("DOCTORATE");

    private final String value;

    DegreeType(String value) {
        this.value = value;
    }

}
