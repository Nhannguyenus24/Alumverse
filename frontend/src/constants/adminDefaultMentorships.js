export const ADMIN_MENTORSHIP_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const ADMIN_MENTORSHIP_SORT_OPTIONS = [
  { value: 'sessionDate', label: 'Session date' },
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'mentorName', label: 'Mentor' },
  { value: 'topic', label: 'Topic' },
];

export const DEFAULT_ADMIN_MENTORSHIPS = [
  {
    id: 7001,
    mentorName: 'Nguyen Phuc Anh',
    menteeName: 'Tran Gia Bao',
    topic: 'Backend career path',
    status: 'CONFIRMED',
    sessionDate: '2026-04-20T09:00:00.000Z',
    durationMinutes: 60,
    feedbackScore: 4.8,
    updatedAt: '2026-04-12T10:00:00.000Z',
  },
  {
    id: 7002,
    mentorName: 'Le Thu Ha',
    menteeName: 'Pham Minh Tuan',
    topic: 'CV review and interview prep',
    status: 'PENDING',
    sessionDate: '2026-04-22T14:00:00.000Z',
    durationMinutes: 45,
    feedbackScore: null,
    updatedAt: '2026-04-13T08:30:00.000Z',
  },
  {
    id: 7003,
    mentorName: 'Tran Duc Long',
    menteeName: 'Vo Thanh An',
    topic: 'Data analyst portfolio',
    status: 'COMPLETED',
    sessionDate: '2026-04-08T19:00:00.000Z',
    durationMinutes: 60,
    feedbackScore: 4.5,
    updatedAt: '2026-04-09T06:45:00.000Z',
  },
  {
    id: 7004,
    mentorName: 'Pham Ngoc Mai',
    menteeName: 'Hoang Hai Dang',
    topic: 'Product mindset fundamentals',
    status: 'CANCELLED',
    sessionDate: '2026-04-11T16:00:00.000Z',
    durationMinutes: 30,
    feedbackScore: null,
    updatedAt: '2026-04-11T15:10:00.000Z',
  },
];
