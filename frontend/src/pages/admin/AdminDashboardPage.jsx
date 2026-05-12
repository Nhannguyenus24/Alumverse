import { useEffect } from 'react';
import { NavLink, useMatch, useOutletContext } from 'react-router';
import { Box, Button, Grid, Skeleton, Stack, Typography, alpha, useTheme } from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import MarkChatUnreadOutlinedIcon from '@mui/icons-material/MarkChatUnreadOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import AdminDashboardSections from '../../components/admin/AdminDashboardSections';
import Chart from '../../components/Chart';
import { useAdminSystemContext } from '../../contexts/AdminSystemContext';
import { useAdminUsersContext } from '../../contexts/AdminUsersContext';
import { useAdminForumContext } from '../../contexts/AdminForumContext';
import useAdminDashboardAggregates from '../../hooks/admin/useAdminDashboardAggregates';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboardPage = () => {
  const theme = useTheme();
  const slugMatchWildcard = useMatch('/:slug/admin/*');
  const slugMatchExact = useMatch('/:slug/admin');
  const slugMatch = slugMatchWildcard ?? slugMatchExact;
  const adminBase = slugMatch?.params?.slug ? `/${slugMatch.params.slug}/admin` : '/admin';
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { loading, metrics, timeline, organizations } = useAdminSystemContext();
  const { allUsers } = useAdminUsersContext();
  const { allPosts, statistics } = useAdminForumContext();
  const aggregates = useAdminDashboardAggregates(allUsers, allPosts, organizations);
  const { setBreadcrumbs } = useOutletContext();

  useEffect(() => {
    setBreadcrumbs?.([{ label: 'Dashboard', active: true }]);
  }, [setBreadcrumbs]);

  const chartData = Array.isArray(timeline) ? timeline : [];
  const totalUsers = metrics?.totalUsers ?? aggregates.user.totalUsers;
  const pendingPosts = metrics?.pendingPosts ?? metrics?.postsAwaitingModerationCount ?? aggregates.forum.pending;
  const totalOrgs = organizations?.length ?? 0;

  if (loading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={100} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={400} />
      </Stack>
    );
  }

  return (
    <Box>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: -1 }}>
          Chào mừng trở lại, {user?.fullName || user?.userName} 👋
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
          Đây là tổng quan về hoạt động của hệ thống HCMUS Alumni ngày hôm nay.
        </Typography>
      </Box>

      {/* Primary Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Tổng thành viên"
            value={totalUsers.toLocaleString()}
            icon={<PeopleAltOutlinedIcon />}
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Bài viết chờ duyệt"
            value={pendingPosts}
            icon={<MarkChatUnreadOutlinedIcon />}
            valueColor="warning.main"
            caption="Cần xử lý ngay"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Tổ chức / Đơn vị"
            value={totalOrgs}
            icon={<BusinessCenterOutlinedIcon />}
            trend={2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Hoạt động hệ thống"
            value={(metrics?.auditLogsCountToday || 0).toLocaleString()}
            icon={<TrendingUpIcon />}
            caption="Bản ghi mới hôm nay"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Main Chart Section */}
        <Grid item xs={12} lg={8}>
          <Box
            sx={{
              p: 3,
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%',
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Biểu đồ hoạt động</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>7 NGÀY GẦN NHẤT</Typography>
            </Box>
            <Chart
              type="area"
              data={chartData}
              dataKey="count"
              xAxisKey="date"
              height={320}
              color={theme.palette.primary.main}
            />
          </Box>
        </Grid>

        {/* Quick Actions Sidebar */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <Box
              sx={{
                p: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.03),
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
                Thao tác nhanh
              </Typography>
              <Stack spacing={1.5}>
                <Button
                  component={NavLink}
                  to="/admin/users"
                  variant="contained"
                  fullWidth
                  startIcon={<GroupsOutlinedIcon />}
                  sx={{ justifyContent: 'flex-start', py: 1.2, fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
                  disabled={!isAdmin}
                >
                  Quản lý người dùng
                </Button>
                <Button
                  component={NavLink}
                  to="/admin/forum/posts"
                  variant="outlined"
                  fullWidth
                  startIcon={<ForumOutlinedIcon />}
                  sx={{ justifyContent: 'flex-start', py: 1.2, fontWeight: 700, textTransform: 'none', borderRadius: 2, bgcolor: 'background.paper' }}
                >
                  Duyệt bài viết Diễn đàn
                </Button>
                <Button
                  component={NavLink}
                  to="/admin/audit-logs"
                  variant="outlined"
                  fullWidth
                  startIcon={<GavelOutlinedIcon />}
                  sx={{ justifyContent: 'flex-start', py: 1.2, fontWeight: 700, textTransform: 'none', borderRadius: 2, bgcolor: 'background.paper' }}
                  disabled={!isAdmin}
                >
                  Xem nhật ký hệ thống
                </Button>
              </Stack>
            </Box>

            {/* System Status or Recent Updates */}
            <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Trạng thái hệ thống</Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Cơ sở dữ liệu</Typography>
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, px: 1, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>ỔN ĐỊNH</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Máy chủ Email</Typography>
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, px: 1, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>ỔN ĐỊNH</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Lưu trữ hình ảnh</Typography>
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, px: 1, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>ỔN ĐỊNH</Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      {/* Secondary Detailed Sections */}
      <Box sx={{ mt: 4 }}>
        <AdminDashboardSections aggregates={aggregates} forumStats={statistics} />
      </Box>
    </Box>
  );
};

export default AdminDashboardPage;
