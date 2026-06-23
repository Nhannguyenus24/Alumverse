import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

export const getMentorshipSidebar = (t) => [
  { id: '/development', label: t('nav:development'), icon: <TrendingUpIcon /> },
  { id: '/development/mentorship', label: t('nav:mentorship'), icon: <SchoolIcon /> },
  { id: '/development/academics', label: t('nav:academics'), icon: <MenuBookIcon /> },
  { id: '/development/jobs', label: t('nav:jobs'), icon: <WorkIcon /> },
];

export const getMentorshipStats = (t) => [
  { value: '500+', label: t('mentorship:stats_mentors') },
  { value: '2,000+', label: t('mentorship:stats_sessions') },
  { value: '100%', label: t('mentorship:stats_alumni_confirmed') },
];

export const MENTORSHIP_LANDING = '/development/mentorship';

export const getMentorProfileTabs = (t) => [
  { label: t('mentorship:profile'), path: '/development/mentorship/profile' },
  { label: t('mentorship:dashboard'), path: '/development/mentorship/dashboard' },
  { label: t('mentorship:calendar'), path: '/development/mentorship/calendar' },
  { label: t('mentorship:my_bookings'), path: '/development/mentorship/my-bookings' },
];

export const getMenteeProfileTabs = (t) => [
  { label: t('mentorship:profile'), path: '/development/mentorship/profile' },
  { label: t('mentorship:my_bookings'), path: '/development/mentorship/my-bookings' },
];
