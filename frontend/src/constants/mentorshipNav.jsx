import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

export const getMentorshipSidebar = (t) => [
  { id: '/development', label: t('nav:development'), icon: <TrendingUpIcon /> },
  { id: '/mentorship', label: t('nav:mentorship'), icon: <SchoolIcon /> },
  { id: '/development/academics', label: t('nav:academics'), icon: <MenuBookIcon /> },
  { id: '/development/jobs', label: t('nav:jobs'), icon: <WorkIcon /> },
];

export const getMentorshipStats = (t) => [
  { value: '500+', label: t('mentorship:stats_mentors') },
  { value: '2,000+', label: t('mentorship:stats_sessions') },
  { value: '100%', label: t('mentorship:stats_alumni_confirmed') },
];

export const MENTORSHIP_LANDING = '/mentorship';

export const getMentorProfileTabs = (t) => [
  { label: t('mentorship:profile'), path: '/mentorship/profile' },
  { label: t('mentorship:dashboard'), path: '/mentorship/dashboard' },
  { label: t('mentorship:calendar'), path: '/mentorship/calendar' },
  { label: t('mentorship:my_bookings'), path: '/mentorship/my-bookings' },
];

export const getMenteeProfileTabs = (t) => [
  { label: t('mentorship:profile'), path: '/mentorship/profile' },
  { label: t('mentorship:my_bookings'), path: '/mentorship/my-bookings' },
];

export const getBaseProfileTabs = (t) => [
  { label: t('mentorship:profile'), path: '/profile' },
];

export const getMentorSignupTabs = (t) => [
  { key: 'profile', label: t('mentorship:mentor_signup_tab_profile') },
  { key: 'content', label: t('mentorship:mentor_signup_tab_content') },
  { key: 'terms', label: t('mentorship:mentor_signup_tab_terms') },
];

export const MENTORSHIP_ACTIVE_SESSION_STATUSES = new Set([
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'RESCHEDULE_PROPOSED',
]);

export const MENTORSHIP_PAST_SESSION_STATUSES = new Set(['COMPLETED', 'EXPIRED']);

export const MENTORSHIP_CANCELLED_SESSION_STATUSES = new Set([
  'CANCELLED',
  'CANCELLED_BY_MENTEE',
  'CANCELLED_BY_MENTOR',
  'REJECTED',
]);

export const getMentorshipBookingStatusFilters = (t) => [
  { key: 'all', label: t('mentorship:bookings_filter_all'), match: () => true },
  {
    key: 'upcoming',
    label: t('mentorship:bookings_filter_upcoming'),
    match: (session) => MENTORSHIP_ACTIVE_SESSION_STATUSES.has(session.status),
  },
  {
    key: 'past',
    label: t('mentorship:bookings_filter_past'),
    match: (session) => MENTORSHIP_PAST_SESSION_STATUSES.has(session.status),
  },
  {
    key: 'cancelled',
    label: t('mentorship:bookings_filter_cancelled'),
    match: (session) => MENTORSHIP_CANCELLED_SESSION_STATUSES.has(session.status),
  },
];
