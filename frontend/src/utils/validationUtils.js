/**
 * Frontend Input Validation Utilities
 * Mirrors backend Jakarta validation constraints
 */

// Email validation (RFC 5322 simplified)
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

// Vietnamese phone: 0[35789]xxxxxxxx (10 digits starting with 0)
export const isValidPhoneNumber = (phone) => {
  if (!phone) return true; // Phone is optional in most cases
  const phoneRegex = /^0[35789]\d{8}$/;
  return phoneRegex.test(phone);
};

// Password: 8-100 chars, must contain uppercase, lowercase, digit, special char
export const isValidPassword = (password) => {
  if (!password || password.length < 8 || password.length > 100) {
    return false;
  }
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  return hasUppercase && hasLowercase && hasDigit && hasSpecialChar;
};

// Required string field: not blank, 2-255 chars
export const isValidText = (text, minLength = 1, maxLength = 255) => {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
};

// Required field: not null/undefined/empty
export const isNotEmpty = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

// String size validation
export const isValidSize = (value, maxLength = 255) => {
  if (!value) return true; // Optional
  return typeof value === 'string' && value.length <= maxLength;
};

// Array/List size validation
export const isValidListSize = (list, maxSize = 100) => {
  if (!list) return true; // Optional
  return Array.isArray(list) && list.length <= maxSize;
};

// ID validation: must be positive integer
export const isValidId = (id) => {
  return Number.isInteger(id) && id > 0;
};

// Date validation: past or present
export const isValidDatePastOrPresent = (date) => {
  if (!date) return true; // Optional
  const dateObj = new Date(date);
  return dateObj <= new Date();
};

// Date validation: future or present
export const isValidDateFutureOrPresent = (date) => {
  if (!date) return true; // Optional
  const dateObj = new Date(date);
  return dateObj >= new Date();
};

// URL validation
export const isValidUrl = (url) => {
  if (!url) return true; // Optional
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validation error messages (mapped to backend error codes)
 */
export const getValidationError = (field, rule, value, params = {}) => {
  const errors = {
    NotBlank: `${field} is required`,
    NotNull: `${field} is required`,
    NotEmpty: `${field} cannot be empty`,
    Size: `${field} must be between ${params.min || 0} and ${params.max || 255} characters`,
    Email: `${field} must be a valid email address`,
    Pattern: `${field} format is invalid`,
    Min: `${field} must be at least ${params.min || 1}`,
    Max: `${field} must be at most ${params.max || 255}`,
    PastOrPresent: `${field} must be in the past or present`,
    FutureOrPresent: `${field} must be in the future or present`,
    URL: `${field} must be a valid URL`,
    Phone: `${field} must be a valid Vietnamese phone number`,
    Password: `${field} must be 8-100 characters with uppercase, lowercase, digit, and special character`,
  };
  return errors[rule] || `${field} is invalid`;
};

/**
 * Validation schema definitions (mirrors backend DTOs)
 */
export const validationSchemas = {
  // Auth
  LoginRequest: {
    organizationId: { required: true, type: 'id' },
    email: { required: true, type: 'email', maxLength: 255 },
    password: { required: true, type: 'text', minLength: 1, maxLength: 255 },
    recaptchaToken: { required: false, type: 'text', maxLength: 255 },
  },
  RegisterRequest: {
    email: { required: true, type: 'email', maxLength: 255 },
    password: { required: true, type: 'password' },
    organizationId: { required: true, type: 'id' },
  },
  ChangePasswordRequest: {
    oldPassword: { required: true, type: 'text', maxLength: 255 },
    newPassword: { required: true, type: 'password' },
  },
  ResetPasswordRequest: {
    email: { required: true, type: 'email' },
    newPassword: { required: true, type: 'password' },
    token: { required: true, type: 'text' },
  },

  // User Profile
  UpdateMyProfileRequest: {
    fullName: { required: false, type: 'text', maxLength: 255 },
    phone: { required: false, type: 'phone' },
    gender: { required: false, type: 'text', maxLength: 255 },
    dob: { required: false, type: 'date-past' },
    bio: { required: false, type: 'text', maxLength: 255 },
    currentJobTitle: { required: false, type: 'text', maxLength: 255 },
    currentCompany: { required: false, type: 'text', maxLength: 255 },
    organizationId: { required: true, type: 'id' },
  },

  // Event
  CreateEventRequest: {
    title: { required: true, type: 'text', minLength: 3, maxLength: 255 },
    description: { required: false, type: 'text', maxLength: 255 },
    location: { required: false, type: 'text', maxLength: 255 },
    startTime: { required: false, type: 'datetime' },
    endTime: { required: false, type: 'datetime' },
    registrationStartAt: { required: false, type: 'datetime' },
    registrationEndAt: { required: false, type: 'datetime' },
  },

  // Forum
  CreateForumPostRequest: {
    topicId: { required: true, type: 'id' },
    content: { required: true, type: 'text', minLength: 10, maxLength: 5000 },
  },
  CreateForumTopicRequest: {
    categoryId: { required: true, type: 'id' },
    title: { required: true, type: 'text', minLength: 3, maxLength: 255 },
    content: { required: true, type: 'text', minLength: 10, maxLength: 5000 },
  },

  // Article
  CreateNewsRequest: {
    title: { required: true, type: 'text', minLength: 3, maxLength: 255 },
    description: { required: false, type: 'text', maxLength: 255 },
    content: { required: true, type: 'text', minLength: 10, maxLength: 5000 },
    thumbnail: { required: false, type: 'url' },
  },

  // Mentorship
  CreateMentorProfileRequest: {
    bio: { required: false, type: 'text', maxLength: 255 },
    meetingLink: { required: false, type: 'url' },
  },
  CreateMenteeProfileRequest: {
    bio: { required: false, type: 'text', maxLength: 255 },
  },

  // Chat/Group
  CreateGroupRequest: {
    title: { required: true, type: 'text', minLength: 2, maxLength: 100 },
  },
  UpdateGroupRequest: {
    title: { required: true, type: 'text', minLength: 2, maxLength: 100 },
  },
  AddMembersRequest: {
    memberIds: { required: true, type: 'list', maxSize: 100 },
  },
};

/**
 * Generic validation function
 */
export const validateField = (fieldName, value, schema) => {
  const fieldSchema = schema[fieldName];
  if (!fieldSchema) return null;

  // Check required
  if (fieldSchema.required && !isNotEmpty(value)) {
    return getValidationError(fieldName, 'NotBlank');
  }

  // If empty and optional, pass
  if (!value && !fieldSchema.required) return null;

  // Type-specific validation
  switch (fieldSchema.type) {
    case 'email':
      if (!isValidEmail(value)) {
        return getValidationError(fieldName, 'Email');
      }
      break;
    case 'password':
      if (!isValidPassword(value)) {
        return getValidationError(fieldName, 'Password');
      }
      break;
    case 'phone':
      if (!isValidPhoneNumber(value)) {
        return getValidationError(fieldName, 'Phone');
      }
      break;
    case 'text':
      if (!isValidText(value, fieldSchema.minLength || 1, fieldSchema.maxLength || 255)) {
        return getValidationError(fieldName, 'Size', value, {
          min: fieldSchema.minLength || 1,
          max: fieldSchema.maxLength || 255,
        });
      }
      break;
    case 'id':
      if (!isValidId(value)) {
        return getValidationError(fieldName, 'Min', value, { min: 1 });
      }
      break;
    case 'list':
      if (!isValidListSize(value, fieldSchema.maxSize || 100)) {
        return getValidationError(fieldName, 'Size', value, { max: fieldSchema.maxSize || 100 });
      }
      break;
    case 'url':
      if (!isValidUrl(value)) {
        return getValidationError(fieldName, 'URL');
      }
      break;
    case 'date-past':
      if (!isValidDatePastOrPresent(value)) {
        return getValidationError(fieldName, 'PastOrPresent');
      }
      break;
    case 'date-future':
      if (!isValidDateFutureOrPresent(value)) {
        return getValidationError(fieldName, 'FutureOrPresent');
      }
      break;
    default:
      break;
  }

  return null;
};

/**
 * Validate entire form against schema
 */
export const validateForm = (formData, schema) => {
  const errors = {};
  Object.keys(schema).forEach((fieldName) => {
    const error = validateField(fieldName, formData[fieldName], schema);
    if (error) {
      errors[fieldName] = error;
    }
  });
  return Object.keys(errors).length > 0 ? errors : null;
};
