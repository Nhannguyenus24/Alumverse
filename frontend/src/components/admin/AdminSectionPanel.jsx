import { Box, Typography, useTheme, alpha } from '@mui/material';

const AdminSectionPanel = ({ title, subtitle, action, children, sx }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
        mb: 4,
        ...sx,
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          bgcolor: alpha(theme.palette.background.default, 0.2),
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: -0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      </Box>
      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default AdminSectionPanel;
