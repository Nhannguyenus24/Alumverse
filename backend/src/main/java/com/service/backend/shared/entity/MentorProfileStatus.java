package com.service.backend.shared.entity;

public final class MentorProfileStatus {

    public static final String DRAFT = "DRAFT";
    public static final String PENDING = "PENDING";
    public static final String APPROVED = "APPROVED";
    public static final String REJECTED = "REJECTED";
    public static final String NEED_UPDATE = "NEED_UPDATE";

    private MentorProfileStatus() {
    }

    public static boolean isValid(String value) {
        return DRAFT.equals(value)
                || PENDING.equals(value)
                || APPROVED.equals(value)
                || REJECTED.equals(value)
                || NEED_UPDATE.equals(value);
    }
}
