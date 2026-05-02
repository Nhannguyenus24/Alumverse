export const ADMIN_ORGANIZATION_OPTIONS = [
  { id: 1, name: 'HCMUS Alumni Tech Club' },
  { id: 2, name: 'HCMUS Data Science Network' },
  { id: 3, name: 'HCMUS Career Support Group' },
  { id: 4, name: 'HCMUS Entrepreneurship Hub' },
  { id: 5, name: 'HCMUS Research Alumni' },
];

export const DEFAULT_ADMIN_USERS = [
  {
    id: 101,
    email: 'an.nguyen@alumverse.io',
    userName: 'annguyen',
    fullName: 'An Nguyen',
    role: 'ALUMNI',
    status: 'ACTIVE',
    organizationId: 1,
    organizationName: 'HCMUS Alumni Tech Club',
    membershipStatus: 'active',
    avatarUrl: '',
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-20T08:00:00.000Z',
  },
  {
    id: 102,
    email: 'linh.tran@alumverse.io',
    userName: 'linhtran',
    fullName: 'Linh Tran',
    role: 'ALUMNI',
    status: 'BANNED',
    organizationId: 2,
    organizationName: 'HCMUS Data Science Network',
    membershipStatus: 'suspended',
    avatarUrl: '',
    createdAt: '2026-03-28T14:30:00.000Z',
    updatedAt: '2026-04-01T09:15:00.000Z',
    banReason: 'Harassment report',
    bannedUntil: null,
  },
  {
    id: 103,
    email: 'minh.le@alumverse.io',
    userName: 'minhle',
    fullName: 'Minh Le',
    role: 'STAFF',
    status: 'ACTIVE',
    organizationId: 1,
    organizationName: 'HCMUS Alumni Tech Club',
    membershipStatus: 'active',
    avatarUrl: '',
    createdAt: '2026-03-15T09:00:00.000Z',
    updatedAt: '2026-03-25T11:00:00.000Z',
  },
];

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
