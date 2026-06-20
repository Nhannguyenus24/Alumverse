import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useOutletContext } from 'react-router';
import {
  Box, Button, IconButton, MenuItem, Select, Skeleton, Stack,
  Tooltip, Typography, alpha, useTheme,
} from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import MarkChatUnreadOutlinedIcon from '@mui/icons-material/MarkChatUnreadOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import AdminDashboardSections from '../../components/admin/AdminDashboardSections';
import Chart from '../../components/Chart';
import { useAdminSystemContext, useAdminUsersContext, useAdminForumContext } from '../../stores/AdminStore';
import useAdminDashboardAggregates from '../../hooks/admin/useAdminDashboardAggregates';
import useAdminDashboardData from '../../hooks/admin/useAdminDashboardData';
import { useAuth } from '../../hooks/useAuth';

const INTERVALS = [
  { value: '0', label: 'Không tự làm mới' },
  { value: '1', label: 'Mỗi 1 phút' },
  { value: '5', label: 'Mỗi 5 phút' },
  { value: '15', label: 'Mỗi 15 phút' },
];

const AdminDashboardPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { loading: systemLoading, organizations } = useAdminSystemContext();
  const { loading: dashboardLoading, metrics, timeline, reload } = useAdminDashboardData();
  const loading = systemLoading || dashboardLoading;
  const { allUsers } = useAdminUsersContext();
  const { allPosts, statistics } = useAdminForumContext();
  const aggregates = useAdminDashboardAggregates(allUsers, allPosts, organizations);
  const { setBreadcrumbs } = useOutletContext();

  const [refreshInterval, setRefreshInterval] = useState('0');
  const [sectionRefreshKey, setSectionRefreshKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setBreadcrumbs?.([{ label: 'Dashboard', active: true }]);
  }, [setBreadcrumbs]);

  const handleRefresh = useCallback(() => {
    reload?.();
    setSectionRefreshKey((k) => k + 1);
    setLastRefreshed(new Date());
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, [reload]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (refreshInterval === '0') return;
    const ms = Number(refreshInterval) * 60 * 1000;
    intervalRef.current = setInterval(handleRefresh, ms);
    return () => clearInterval(intervalRef.current);
  }, [refreshInterval, handleRefresh]);

  const chartData = Array.isArray(timeline) ? timeline : [];
  const totalUsers = metrics?.totalUsers ?? aggregates.user.totalUsers;
  const pendingPosts = metrics?.pendingPosts ?? metrics?.postsAwaitingModerationCount ?? aggregates.forum.pending;
  const totalOrgs = organizations?.length ?? 0;

  if (loading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={100} />
        <Stack direction="row" flexWrap="wrap" spacing={3} useFlexGap>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Box key={i} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 0' } }}>
              <Skeleton variant="rounded" height={140} />
            </Box>
          ))}
        </Stack>
        <Skeleton variant="rounded" height={400} />
      </Stack>
    );
  }

  const donationsLast30Days = metrics?.donationsLast30Days ?? 0;
  const donationsFormatted = Number(donationsLast30Days).toLocaleString('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
  });

  return (
    <Stack spacing={4}>
      {/* Welcome Header + Refresh Controls */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
            Chào mừng trở lại, {user?.fullName || user?.studentId}!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            Đây là tổng quan về hoạt động của hệ thống AlumVerse ngày hôm nay.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          {lastRefreshed && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {lastRefreshed.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
          )}
          <Tooltip title="Làm mới ngay">
            <IconButton
              size="small"
              onClick={handleRefresh}
              sx={{
                color: 'primary.main',
                '& svg': {
                  transition: 'transform 0.1s',
                  animation: refreshing ? 'dashboardSpin 0.8s linear infinite' : 'none',
                  '@keyframes dashboardSpin': {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                  },
                },
              }}
            >
              <RefreshOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(e.target.value)}
            size="small"
            sx={{
              fontSize: 12, fontWeight: 700,
              minWidth: 110,
              '& .MuiSelect-select': { py: 0.75, px: 1.5 },
            }}
          >
            {INTERVALS.map(({ value, label }) => (
              <MenuItem key={value} value={value} sx={{ fontSize: 13, fontWeight: 600 }}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </Stack>

      {/* Primary Metrics */}
      <Stack spacing={3}>
        <Stack
          direction="row"
          flexWrap="wrap"
          spacing={3}
          useFlexGap
          sx={{ '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 0' } } }}
        >
          <AdminDashboardMetricTile
            label="Tổng thành viên"
            value={totalUsers.toLocaleString()}
            icon={<PeopleAltOutlinedIcon />}
            trend={12}
          />
          <AdminDashboardMetricTile
            label="Bài viết chờ duyệt"
            value={pendingPosts}
            icon={<MarkChatUnreadOutlinedIcon />}
            caption="Cần xử lý ngay"
          />
          <AdminDashboardMetricTile
            label="Tổ chức / Đơn vị"
            value={totalOrgs}
            icon={<BusinessCenterOutlinedIcon />}
            trend={2}
          />
        </Stack>
        <Stack
          direction="row"
          flexWrap="wrap"
          spacing={3}
          useFlexGap
          sx={{ '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 0' } } }}
        >
          <AdminDashboardMetricTile
            label="Hoạt động hệ thống"
            value={(metrics?.auditLogsCountToday || 0).toLocaleString()}
            icon={<TrendingUpIcon />}
            caption="Bản ghi mới hôm nay"
          />
          <AdminDashboardMetricTile
            label="Chờ xác minh"
            value={(metrics?.pendingVerifications || 0).toLocaleString()}
            icon={<VerifiedUserOutlinedIcon />}
            caption="Yêu cầu xác minh"
          />
          <AdminDashboardMetricTile
            label="Quyên góp gần đây"
            value={donationsFormatted}
            icon={<VolunteerActivismOutlinedIcon />}
            caption={`${(metrics?.totalDonationsCount || 0).toLocaleString()} lượt trong 30 ngày qua`}
          />
        </Stack>
      </Stack>

      {/* Main Chart + Sidebar */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        <Box flex={3} minWidth={0}>
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
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>Biểu đồ hoạt động</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>7 ngày qua</Typography>
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
        </Box>

        <Box flex={1} minWidth={0}>
          <Stack spacing={3}>
            <Box
              sx={{
                p: 3,
                bgcolor: 'background.paper',
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
                Thao tác nhanh
              </Typography>
              <Stack spacing={1.5}>
                <Button
                  component={NavLink}
                  to="/admin/users"
                  variant="outlined"
                  fullWidth
                  startIcon={<GroupsOutlinedIcon />}
                  sx={{ justifyContent: 'flex-start', py: 1.2, fontWeight: 700, textTransform: 'none', borderRadius: 1 }}
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
                  sx={{ justifyContent: 'flex-start', py: 1.2, fontWeight: 700, textTransform: 'none', borderRadius: 1 }}
                >
                  Duyệt bài viết diễn đàn
                </Button>
                <Button
                  component={NavLink}
                  to="/admin/audit-logs"
                  variant="outlined"
                  fullWidth
                  startIcon={<GavelOutlinedIcon />}
                  sx={{ justifyContent: 'flex-start', py: 1.2, fontWeight: 700, textTransform: 'none', borderRadius: 1 }}
                  disabled={!isAdmin}
                >
                  Xem nhật ký hệ thống
                </Button>
              </Stack>
            </Box>

            <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>Trạng thái hệ thống</Typography>
              <Stack spacing={2}>
                {[['Cơ sở dữ liệu'], ['Máy chủ Email'], ['Lưu trữ hình ảnh']].map(([label]) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, px: 1, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
                      ỔN ĐỊNH
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Stack>

      {/* Detailed Sections — key forces remount of all section hooks on refresh */}
      <AdminDashboardSections
        key={sectionRefreshKey}
        aggregates={aggregates}
        forumStats={statistics}
      />
    </Stack>
  );
};

export default AdminDashboardPage;
