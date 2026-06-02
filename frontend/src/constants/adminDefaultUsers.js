/** Must match backend com.service.backend.shared.enums.UserRole */
export const USER_ROLES = ['ADMIN', 'STUDENT', 'ALUMNI', 'STAFF', 'GUEST'];

/** Must match backend com.service.backend.shared.enums.UserStatus (order + spelling) */
export const USER_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'BANNED',
  'SUSPENDED',
  'DELETED',
  'DISABLED',
  'PENDING',
  'UNVERIFIED',
];

export const BAN_REASON_OPTIONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'OTHER', label: 'Other (custom text)' },
];
