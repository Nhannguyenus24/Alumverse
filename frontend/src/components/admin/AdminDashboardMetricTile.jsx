import React from 'react';
import { alpha, Box, Paper, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

const AdminDashboardMetricTile = ({ label, value, caption, icon, trend, sx }) => {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const trendColor = trend > 0 ? theme.palette.success.main : theme.palette.error.main;

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
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 11 }}>
          {label}
        </Typography>
        {icon && (
          <Box sx={{ borderRadius: 2, color: 'primary.main', display: 'flex' }}>
            {icon}
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 'auto' }}>
        <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 800, lineHeight: 1 }}>
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
                  bgcolor: alpha(trendColor, theme.palette.mode === 'dark' ? 0.16 : 0.1),
                  color: trendColor,
                }}
              >
                {trend > 0 ? `+${trend}%` : `${trend}%`}
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled" fontWeight={500}>
              {caption || t('compared_to_last_month')}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default React.memo(AdminDashboardMetricTile);
