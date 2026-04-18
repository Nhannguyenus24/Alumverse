export const ADMIN_ORGANIZATION_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING_REVIEW', label: 'Pending review' },
];

export const ADMIN_ORGANIZATION_SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'memberCount', label: 'Members' },
  { value: 'createdAt', label: 'Created date' },
];

export const DEFAULT_ADMIN_ORGANIZATIONS = [
  {
    id: 8001,
    name: 'HCMUS Alumni IT Club',
    status: 'ACTIVE',
    ownerName: 'Tran Minh Khang',
    memberCount: 520,
    eventCount: 16,
    createdAt: '2025-11-20T09:00:00.000Z',
    updatedAt: '2026-04-10T08:00:00.000Z',
  },
  {
    id: 8002,
    name: 'Data Science Community',
    status: 'PENDING_REVIEW',
    ownerName: 'Le Bao Chau',
    memberCount: 134,
    eventCount: 4,
    createdAt: '2026-03-02T13:30:00.000Z',
    updatedAt: '2026-04-13T07:15:00.000Z',
  },
  {
    id: 8003,
    name: 'Startup Founder Network',
    status: 'ACTIVE',
    ownerName: 'Pham Quoc Viet',
    memberCount: 231,
    eventCount: 9,
    createdAt: '2025-12-01T10:45:00.000Z',
    updatedAt: '2026-04-12T16:20:00.000Z',
  },
  {
    id: 8004,
    name: 'AI Research Circle',
    status: 'INACTIVE',
    ownerName: 'Vo Bao Nhi',
    memberCount: 78,
    eventCount: 2,
    createdAt: '2025-09-17T15:20:00.000Z',
    updatedAt: '2026-03-20T11:50:00.000Z',
  },
];
