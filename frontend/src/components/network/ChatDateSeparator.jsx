import { Box, Typography, alpha } from '@mui/material';

const ChatDateSeparator = ({ label }) => {
  if (!label) return null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
      <Typography
        variant="caption"
        sx={{
          px: 1.25,
          py: 0.25,
          borderRadius: 999,
          color: 'text.secondary',
          bgcolor: (theme) =>
            alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.1 : 0.06),
          fontSize: '0.7rem',
          lineHeight: 1.4,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

export default ChatDateSeparator;
