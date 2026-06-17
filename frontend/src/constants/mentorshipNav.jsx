import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

export const MENTORSHIP_SIDEBAR = [
  { id: '/development', label: 'Phát triển', icon: <TrendingUpIcon /> },
  { id: '/development/mentorship', label: 'Cố vấn', icon: <SchoolIcon /> },
  { id: '/development/academics', label: 'Cơ hội học tập', icon: <MenuBookIcon /> },
  { id: '/development/jobs', label: 'Cơ hội việc làm', icon: <WorkIcon /> },
];

export const MENTORSHIP_STATS = [
  { value: '500+', label: 'cố vấn' },
  { value: '2,000+', label: 'buổi họp' },
  { value: '100%', label: 'alumni đã xác nhận' },
];

export const MENTORSHIP_LANDING = '/development/mentorship';
/** @deprecated use MENTORSHIP_LANDING — browse is inline on hub page for v1/v2 */
export const MENTORSHIP_BROWSE = MENTORSHIP_LANDING;

/** Tabs for an approved mentor's personal workspace. */
export const MENTOR_PROFILE_TABS = [
  { label: 'Trang cá nhân', path: '/development/mentorship/profile' },
  { label: 'Tổng quan', path: '/development/mentorship/dashboard' },
  { label: 'Quản lý khung giờ', path: '/development/mentorship/calendar' },
  { label: 'Lịch hẹn của tôi', path: '/development/mentorship/my-bookings' },
];

/** Tabs for a mentee's personal workspace. */
export const MENTEE_PROFILE_TABS = [
  { label: 'Trang cá nhân', path: '/development/mentorship/profile' },
  { label: 'Lịch hẹn của tôi', path: '/development/mentorship/my-bookings' },
];
