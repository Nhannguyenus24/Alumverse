/** Must match backend com.service.backend.shared.enums.UserRole */
export const USER_ROLES = ['ADMIN', 'USER', 'STAFF'];



export const GRADUATION_STATUSES = ['STUDYING', 'GRADUATED', 'DROPPED'];

export const VERIFICATION_LEVELS = [0, 1, 2, 3, 4];

export const BAN_REASON_OPTIONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'OTHER', label: 'Other (custom text)' },
];
