import {
  Box,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';

const ForumFilterPanel = ({ filters, selectedId, onChange }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 0,
        overflow: 'hidden',
        backgroundColor: '#fff',
        boxShadow: 'none',
      }}
    >
      <Box sx={{ p: 1 }}>
        <List disablePadding>
          {filters.map((f) => {
            const selected = f.id === selectedId;
            return (
              <ListItemButton
                key={f.id}
                onClick={() => onChange?.(f.id)}
                sx={{
                  borderRadius: 1,
                  py: 1.35,
                  px: 1.25,
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: selected ? '#0B4D8D' : 'text.primary',
                  }}
                >
                  <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 22 }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      fontWeight={selected ? 800 : 500}
                      sx={{
                        color: selected ? '#0B4D8D' : 'text.primary',
                        fontSize: { xs: '1rem', md: '1.05rem' },
                      }}
                    >
                      {f.label}
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

export default ForumFilterPanel;

