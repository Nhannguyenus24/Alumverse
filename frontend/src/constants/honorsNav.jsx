import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export const getHonorsSidebarItems = (t) => [
  { id: '/honors', label: t('honors:sidebar_honors'), icon: <EmojiEventsIcon /> },
  { id: '/honors/alumni', label: t('honors:sidebar_alumni'), icon: <GroupsIcon /> },
  { id: '/honors/achievements', label: t('honors:sidebar_achievements'), icon: <TrendingUpIcon /> },
];
