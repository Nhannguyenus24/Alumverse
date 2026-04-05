import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { NavLink } from 'react-router';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import { useAdminSystemContext } from '../../contexts/AdminSystemContext';

const AdminAnalyticsPage = () => {
  const { loading, metrics, auditLogs } = useAdminSystemContext();

  return (
    <Stack spacing={2}>
      <AdminSectionPanel
        title="Analytics & reports"
        subtitle="High-level summary placeholder (design §4.2). Connect /api/admin/analytics/* for charts."
      >
        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body2">
                <strong>Total users (dashboard metric):</strong> {metrics?.totalUsers ?? '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Banned today:</strong> {metrics?.bannedTodayCount ?? '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Pending moderation posts:</strong>{' '}
                {metrics?.pendingPosts ?? metrics?.postsAwaitingModerationCount ?? '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Audit rows loaded (current session):</strong> {auditLogs?.length ?? 0}
              </Typography>
              <Button
                component={NavLink}
                to="/admin/audit-logs"
                variant="outlined"
                sx={{ textTransform: 'none', alignSelf: 'flex-start', mt: 1 }}
              >
                Open audit logs
              </Button>
            </Box>
          </Paper>
        )}
      </AdminSectionPanel>
    </Stack>
  );
};

export default AdminAnalyticsPage;
