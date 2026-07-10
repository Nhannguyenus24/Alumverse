
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';

export const getMentorshipStats = (t) => [
  { value: '500+', label: t('mentorship:stats_mentors') },
  { value: '2,000+', label: t('mentorship:stats_sessions') },
  { value: '100%', label: t('mentorship:stats_alumni_confirmed') },
];

export const MENTORSHIP_LANDING = '/mentorship';

export const getMentorProfileTabs = (t) => [
  { label: t('mentorship:profile'), path: '/mentorship/profile', icon: <PersonOutlineOutlinedIcon fontSize="small" /> },
  { label: t('mentorship:dashboard'), path: '/mentorship/dashboard', icon: <DashboardOutlinedIcon fontSize="small" /> },
  { label: t('mentorship:calendar'), path: '/mentorship/calendar', icon: <CalendarMonthOutlinedIcon fontSize="small" /> },
  { label: t('mentorship:my_bookings'), path: '/mentorship/my-bookings', icon: <EventNoteOutlinedIcon fontSize="small" /> },
];

export const getMenteeProfileTabs = (t) => [
  { label: t('mentorship:profile'), path: '/mentorship/profile', icon: <PersonOutlineOutlinedIcon fontSize="small" /> },
  { label: t('mentorship:my_bookings'), path: '/mentorship/my-bookings', icon: <EventNoteOutlinedIcon fontSize="small" /> },
];

export const getMentorshipProfileOnlyTabs = (t) => [
  { label: t('mentorship:profile'), path: '/mentorship/profile', icon: <PersonOutlineOutlinedIcon fontSize="small" /> },
];

export const getBaseProfileTabs = (t) => [
  { label: t('mentorship:profile'), path: '/profile', icon: <PersonOutlineOutlinedIcon fontSize="small" /> },
];

export const getMentorSignupTabs = (t) => [
  { key: 'profile', label: t('mentorship:mentor_signup_tab_profile') },
  { key: 'content', label: t('mentorship:mentor_signup_tab_content') },
  { key: 'terms', label: t('mentorship:mentor_signup_tab_terms') },
];

const MENTORSHIP_ACTIVE_SESSION_STATUSES = new Set([
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'RESCHEDULE_PROPOSED',
]);

const MENTORSHIP_PAST_SESSION_STATUSES = new Set(['COMPLETED', 'EXPIRED']);

const MENTORSHIP_CANCELLED_SESSION_STATUSES = new Set([
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
