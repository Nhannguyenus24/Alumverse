import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import EventIcon from '@mui/icons-material/Event';
import ArticleIcon from '@mui/icons-material/Article';

export const ACTIVITIES_SIDEBAR = [
  { id: '/activities', label: 'Hoạt động', icon: <LocalActivityIcon /> },
  { id: '/activities/events', label: 'Sự kiện', icon: <EventIcon /> },
  { id: '/activities/news', label: 'Tin tức', icon: <ArticleIcon /> },
];
