import { Stack, Button } from '@mui/material';
import { useLocation } from 'react-router';

const TopTabFilter = ({ tabs, onNavigate }) => {
  const location = useLocation();

  return (
    <Stack direction="row" spacing={1.5} flexWrap="wrap">
      {tabs.map((tab) => {
        const isActive =
          tab.path === '/development/mentorship'
            ? location.pathname === tab.path
            : location.pathname.startsWith(tab.path);

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