import { Stack, Button } from '@mui/material';
import { useLocation } from 'react-router';

const TopTabFilter = ({ tabs, onNavigate }) => {
  const location = useLocation();
  const normalizedPath = location.pathname.replace(/^\/[^/]+/, '');

  return (
    <Stack direction="row" flexWrap="wrap" sx={{ gap: 1.5 }}>
      {tabs.map((tab) => {
        const isActive =
          tab.path === '/development/mentorship'
            ? normalizedPath === tab.path
            : normalizedPath.startsWith(tab.path);

        return (
          <Button
            key={tab.label}
            variant={isActive ? 'contained' : 'outlined'}
            onClick={() => onNavigate(tab.path)}
            sx={{ 
                textTransform: 'none', 
                fontWeight: 600,
                borderRadius: '8px',
                px: 3
            }}
          >
            {tab.label}
          </Button>
        );
      })}
    </Stack>
  );
};

export default TopTabFilter;