import { Box, Paper, Typography, alpha, useTheme } from '@mui/material';

const AdminDashboardMetricTile = ({ label, value, caption, icon, valueColor = 'primary.main', trend }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        flex: '1 1 200px',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        bgcolor: 'background.paper',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 11 }}>
          {label}
        </Typography>
        {icon && (
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
            {icon}
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 'auto' }}>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 800, lineHeight: 1 }}>
          {value}
        </Typography>
        
        {(trend || caption) && (
          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            {trend && (
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 700, 
                  px: 1, 
                  py: 0.25, 
                  borderRadius: 1, 
                  bgcolor: trend > 0 ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                  color: trend > 0 ? 'success.main' : 'error.main',
                }}
              >
                {trend > 0 ? `+${trend}%` : `${trend}%`}
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled" fontWeight={500}>
              {caption || 'so với tháng trước'}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default AdminDashboardMetricTile;
