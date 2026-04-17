import {
  Box,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router';

const Sidebar = ({ items, value, onChange, useRouting = true }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 0,
        overflow: 'hidden',
        backgroundColor: 'white',
      }}
    >
      <Box sx={{ p: 1 }}>
        <List disablePadding>
          {items.map((item) => {
            const selected = useRouting
            ? location.pathname === item.id
            : value === item.id;

          const handleClick = () => {
            if (useRouting) {
              navigate(item.id);
            } else {
              onChange?.(item.id);
            }
          };

            return (
              <ListItemButton
                key={item.id}
                onClick={handleClick}
                sx={{
                  borderRadius: 1,
                  py: 1.2,
                  px: 1.25,
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                {/* ICON */}
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: selected ? 'primary.main' : 'text.primary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                {/* TEXT */}
                <ListItemText
                  primary={
                    <Typography
                      fontSize="1rem"
                      fontWeight={selected ? 700 : 500}
                      sx={{
                        color: selected ? 'primary.main' : 'text.primary',
                      }}
                    >
                      {item.label}
                    </Typography>
                  }
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </Paper>
  );
};

export default Sidebar;