import { NavLink, useMatch } from 'react-router';
import { Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import AdminDashboardSections from '../../components/admin/AdminDashboardSections';
import Chart from '../../components/Chart';
import { useAdminSystemContext } from '../../contexts/AdminSystemContext';
import { useAdminUsersContext } from '../../contexts/AdminUsersContext';
import { useAdminForumContext } from '../../contexts/AdminForumContext';
import useAdminDashboardAggregates from '../../hooks/admin/useAdminDashboardAggregates';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboardPage = () => {
  const slugMatch = useMatch('/:slug/admin/*') ?? useMatch('/:slug/admin');
  const adminBase = slugMatch?.params?.slug ? `/${slugMatch.params.slug}/admin` : '/admin';
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { loading, metrics, timeline, organizations } = useAdminSystemContext();
  const { allUsers } = useAdminUsersContext();
  const { allPosts, statistics } = useAdminForumContext();
  const aggregates = useAdminDashboardAggregates(allUsers, allPosts, organizations);

  const chartData = Array.isArray(timeline) ? timeline : [];
  const totalUsers = metrics?.totalUsers ?? aggregates.user.totalUsers;
  const bannedToday = metrics?.bannedTodayCount ?? 0;
  const pendingPosts = metrics?.pendingPosts ?? metrics?.postsAwaitingModerationCount ?? aggregates.forum.pending;
  const auditToday = metrics?.auditLogsCount ?? metrics?.auditLogsCountToday ?? 0;

  return (
    <Stack spacing={2.5} sx={{ width: '100%' }}>
      {loading ? (
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
          <Stack spacing={1}>
            <Skeleton variant="text" width={220} height={40} />
            <Skeleton variant="rounded" height={120} />
            <Skeleton variant="rounded" height={220} />
          </Stack>
        </Paper>
      ) : (
        <>
          <AdminSectionPanel
            title="Admin dashboard"
            subtitle="Summary metrics, last 7 days activity, and quick links."
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
              <AdminDashboardMetricTile label="Total users" value={totalUsers} valueColor="primary.main" />
              <AdminDashboardMetricTile label="Users banned today" value={bannedToday} valueColor="error.main" />
              <AdminDashboardMetricTile
                label="Forum posts pending moderation"
                value={pendingPosts}
                valueColor="warning.main"
              />
              <AdminDashboardMetricTile label="Audit logs today" value={auditToday} valueColor="info.main" />
              {/* Forum overview tiles from API */}
              {statistics && (
                <>
                  <AdminDashboardMetricTile
                    label="Forum topics"
                    value={statistics.totalTopics ?? 0}
                    valueColor="info.main"
                  />
                  <AdminDashboardMetricTile
                    label="Forum posts"
                    value={statistics.totalPosts ?? 0}
                    valueColor="primary.dark"
                  />
                  <AdminDashboardMetricTile
                    label="New topics today"
                    value={statistics.newTopicsToday ?? 0}
                    valueColor="success.main"
                  />
                  <AdminDashboardMetricTile
                    label="New posts today"
                    value={statistics.newPostsToday ?? 0}
                    valueColor="success.dark"
                  />
                </>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'stretch' }}>
              <Box sx={{ flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column' }}>
                <Chart
                  type="line"
                  title="Recent activity (last 7 days)"
                  data={chartData}
                  dataKey="count"
                  xAxisKey="date"
                  height={280}
                />
              </Box>
              <Box
                sx={{
                  flex: '1 1 220px',
                  minWidth: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Quick actions
                </Typography>
                <Button
                  component={NavLink}
                  to={`${adminBase}/users`}
                  variant="outlined"
                  startIcon={<GroupsOutlinedIcon />}
                  sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                  disabled={!isAdmin}
                >
                  User management
                </Button>
                <Button
                  component={NavLink}
                  to={`${adminBase}/forum/posts`}
                  variant="outlined"
                  startIcon={<ForumOutlinedIcon />}
                  sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                >
                  Forum moderation
                </Button>
                <Button
                  component={NavLink}
                  to={`${adminBase}/audit-logs`}
                  variant="outlined"
                  startIcon={<GavelOutlinedIcon />}
                  sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                  disabled={!isAdmin}
                >
                  Audit logs
                </Button>
              </Box>
            </Box>
          </AdminSectionPanel>

          <AdminDashboardSections aggregates={aggregates} forumStats={statistics} />
        </>
      )}
    </Stack>
  );
};

export default AdminDashboardPage;
