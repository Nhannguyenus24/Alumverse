package com.service.backend.shared.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validates that a meeting link belongs to a whitelisted conferencing
 * provider (ME-01). By default a blank value is accepted, so it can be applied
 * to optional fields; combine with {@code @NotBlank} when the link is required.
 */
@Documented
@Constraint(validatedBy = MeetingLinkValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidMeetingLink {

    String message() default
            "Link họp không hợp lệ. Chỉ chấp nhận link từ: "
            + "Google Meet, Zoom, Microsoft Teams, Jitsi Meet, Whereby, Webex, GoToMeeting.";

    /** When {@code true} (default) a blank / null value passes validation. */
    boolean allowBlank() default true;

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
