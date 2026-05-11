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
        backgroundColor: 'white',
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
                  py: 1.2,
                  px: 1.25,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                {/* ICON */}
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: selected ? 'primary.main' : 'text.primary',
                  }}
                >
                  <ChatBubbleOutlineOutlinedIcon />
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