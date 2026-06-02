package com.service.backend.shared.enums;

import lombok.Getter;

@Getter
public enum LearningResourceType {
    COURSE("COURSE"),
    EBOOK("EBOOK"),
    VIDEO("VIDEO"),
    OTHER("OTHER");

    private final String value;

    LearningResourceType(String value) {
        this.value = value;
    }
}
