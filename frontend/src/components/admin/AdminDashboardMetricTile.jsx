import { Paper, Typography } from '@mui/material';

const AdminDashboardMetricTile = ({ label, value, caption, valueColor = 'primary.main' }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        minWidth: 140,
        flex: '1 1 160px',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ color: valueColor, fontWeight: 800, lineHeight: 1.2 }}>
        {value}
      </Typography>
      {caption ? (
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      ) : null}
    </Paper>
  );
};

export default AdminDashboardMetricTile;
