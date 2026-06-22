package com.service.backend.shared.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * {@link ValidMeetingLink} implementation. Delegates the whitelist check to
 * {@link MeetingLinkSupport}.
 */
public class MeetingLinkValidator implements ConstraintValidator<ValidMeetingLink, String> {

    private boolean allowBlank;

    @Override
    public void initialize(ValidMeetingLink constraintAnnotation) {
        this.allowBlank = constraintAnnotation.allowBlank();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return allowBlank;
        }
        return MeetingLinkSupport.isAllowed(value);
    }
}
