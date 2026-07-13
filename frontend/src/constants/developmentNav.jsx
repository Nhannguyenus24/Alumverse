import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

export const getDevelopmentSidebarItems = (t) => [
  { id: '/development', label: t('dev:title'), icon: <TrendingUpIcon /> },
  { id: '/development/academics', label: t('dev:academics'), icon: <MenuBookIcon /> },
  { id: '/development/jobs', label: t('dev:jobs'), icon: <WorkIcon /> },
];
