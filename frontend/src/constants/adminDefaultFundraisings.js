export const ADMIN_FUNDRAISING_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
];

export const ADMIN_FUNDRAISING_SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'title', label: 'Title' },
  { value: 'targetAmount', label: 'Target amount' },
  { value: 'raisedAmount', label: 'Raised amount' },
];

export const DEFAULT_ADMIN_FUNDRAISINGS = [
  {
    id: 9001,
    title: 'Scholarship Fund - Semester 1',
    status: 'ACTIVE',
    ownerName: 'Faculty Office',
    targetAmount: 500000000,
    raisedAmount: 325000000,
    donorCount: 185,
    updatedAt: '2026-04-13T09:10:00.000Z',
  },
  {
    id: 9002,
    title: 'Support Freshman Hardship Cases',
    status: 'PAUSED',
    ownerName: 'Student Affairs',
    targetAmount: 180000000,
    raisedAmount: 92000000,
    donorCount: 73,
    updatedAt: '2026-04-11T15:20:00.000Z',
  },
  {
    id: 9003,
    title: 'Research Lab Equipment Upgrade',
    status: 'DRAFT',
    ownerName: 'FIT Research Office',
    targetAmount: 700000000,
    raisedAmount: 0,
    donorCount: 0,
    updatedAt: '2026-04-12T11:35:00.000Z',
  },
  {
    id: 9004,
    title: 'Graduation Ceremony Sponsorship',
    status: 'COMPLETED',
    ownerName: 'Alumni Relations',
    targetAmount: 250000000,
    raisedAmount: 268000000,
    donorCount: 124,
    updatedAt: '2026-03-21T07:40:00.000Z',
  },
];
