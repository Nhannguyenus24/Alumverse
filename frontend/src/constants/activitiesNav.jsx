import EventIcon from '@mui/icons-material/Event';
import ArticleIcon from '@mui/icons-material/Article';

export const getActivitiesSidebar = (t) => [
  { id: '/news', label: t('nav:news'), icon: <ArticleIcon /> },
  { id: '/events', label: t('nav:events'), icon: <EventIcon /> },
];
