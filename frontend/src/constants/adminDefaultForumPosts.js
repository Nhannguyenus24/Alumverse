export const FORUM_STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FLAGGED', label: 'Flagged' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

/** Local demo posts — moderationStatus drives Approve / Reject / Delete flows */
export const DEFAULT_FORUM_POSTS = [
  {
    id: 9001,
    authorId: 201,
    authorName: 'Thanh Pham',
    categoryId: 2,
    categoryName: 'Alumni Career',
    topicTitle: 'Internship sharing 2026',
    content:
      'This post has several reports for review. I want to share my internship experience at a tech company including interview tips and daily workflow. Some sections were flagged by AI for potentially sensitive wording.',
    moderationStatus: 'FLAGGED',
    flagsCount: 3,
    postedAt: '2026-03-29T11:00:00.000Z',
  },
  {
    id: 9002,
    authorId: 202,
    authorName: 'Khanh Vo',
    categoryId: 1,
    categoryName: 'General',
    topicTitle: 'Scholarship support',
    content:
      'Need admin verification before publishing. I am collecting information about scholarships for alumni and need confirmation that links are official.',
    moderationStatus: 'PENDING',
    flagsCount: 0,
    postedAt: '2026-03-30T08:15:00.000Z',
  },
  {
    id: 9003,
    authorId: 203,
    authorName: 'My Ho',
    categoryId: 2,
    categoryName: 'Alumni Career',
    topicTitle: 'Community guideline',
    content:
      'Language seems inappropriate in section 2 according to automated scan. I apologize if any phrase was misinterpreted and will revise.',
    moderationStatus: 'FLAGGED',
    flagsCount: 5,
    postedAt: '2026-03-31T16:45:00.000Z',
  },
  {
    id: 9004,
    authorName: 'Lan Pham',
    topicTitle: 'Alumni meetup photos',
    content: 'Sharing photos from last weekend meetup. Great turnout from Class of 2018.',
    moderationStatus: 'APPROVED',
    flagsCount: 0,
    postedAt: '2026-04-01T07:20:00.000Z',
  },
  {
    id: 9005,
    authorId: 205,
    authorName: 'Huy Nguyen',
    categoryId: 3,
    categoryName: 'Events',
    topicTitle: 'Job referral request',
    content: 'Looking for a referral at a partner company. Removed contact details per previous moderator request.',
    moderationStatus: 'REJECTED',
    flagsCount: 2,
    postedAt: '2026-03-27T12:00:00.000Z',
  },
];
