import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import EventIcon from '@mui/icons-material/Event';
import ArticleIcon from '@mui/icons-material/Article';

export const getActivitiesSidebar = (t) => [
  { id: '/activities', label: t('nav:activities'), icon: <LocalActivityIcon /> },
  { id: '/activities/events', label: t('nav:events'), icon: <EventIcon /> },
  { id: '/activities/news', label: t('nav:news'), icon: <ArticleIcon /> },
];
