package com.service.backend.shared.constants;

public enum ErrorCode {
    RESOURCES_DUPLICATE,
    INVALID_PASSWORD,
    USER_NOT_FOUND,

    // Event modularr
    EVENT_NOT_FOUND,
    TICKET_NOT_FOUND,
    EVENT_FULLY_BOOKED,
    ALREADY_INTERESTED,
    TICKET_ALREADY_CANCELLED,
    TICKET_ALREADY_CHECKED_IN,
}
