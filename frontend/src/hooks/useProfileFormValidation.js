import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getUpdateMyProfileSchema } from '../utils/regexUtils';

/**
 * Hook for profile form validation
 * Returns Zod schema for use with react-hook-form
 */
export const useProfileFormValidation = () => {
  const { t } = useTranslation();
  return useMemo(() => getUpdateMyProfileSchema(t), [t]);
};

/**
 * Validate profile form data before submission
 */
export const validateProfileData = (formData) => {
  const errors = {};
  const { validateVietnamPhone } = require('../utils/regexUtils');

  // Phone validation
  if (formData.phone) {
    const phoneError = validateVietnamPhone(formData.phone, { optional: true }, null);
    if (phoneError) {
      errors.phone = phoneError;
    }
  }

  // Organization ID validation
  if (!formData.organizationId || formData.organizationId <= 0) {
    errors.organizationId = 'Organization ID is required';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};
