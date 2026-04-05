import { Box, Paper, Typography } from '@mui/material';

const AdminSectionPanel = ({ title, subtitle, action, children }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.neutral',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action || null}
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
};

export default AdminSectionPanel;
