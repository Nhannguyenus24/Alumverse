import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { NavLink, useOutletContext } from 'react-router';
import { useTranslation } from 'react-i18next';
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
import { useMyProfile } from '../../hooks/profile/useMyProfile';

const AdminDashboardPage = () => {
  const theme = useTheme();
  const { t } = useTranslation(['admin']);
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const isAdmin = user?.role === 'ADMIN';
  const { loading: systemLoading, organizations } = useAdminSystemContext();
  const { loading: dashboardLoading, metrics, timeline, reload } = useAdminDashboardData();
  const loading = systemLoading || dashboardLoading;
  const { allUsers } = useAdminUsersContext();
  const { allPosts, statistics } = useAdminForumContext();
  const aggregates = useAdminDashboardAggregates(allUsers, allPosts, organizations);
  const { setBreadcrumbs } = useOutletContext();
  const displayName =
    profile?.fullName ||
    profile?.name ||
    user?.fullName ||
    user?.name ||
    profile?.studentId ||
    user?.studentId ||
    'ADMIN';

  const INTERVALS = useMemo(() => [
    { value: '0', label: t('admin:refresh_interval_none') },
    { value: '1', label: t('admin:refresh_interval_1m') },
    { value: '5', label: t('admin:refresh_interval_5m') },
    { value: '15', label: t('admin:refresh_interval_15m') },
  ], [t]);

  const SYSTEM_STATUS_ITEMS = useMemo(() => [
    [t('admin:system_db')],
    [t('admin:system_email')],
    [t('admin:system_image_storage')],
  ], [t]);

  const [refreshInterval, setRefreshInterval] = useState('0');
  const [sectionRefreshKey, setSectionRefreshKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setBreadcrumbs?.([{ label: t('admin:breadcrumb_dashboard'), active: true }]);
  }, [setBreadcrumbs, t]);

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

  const { chartData, totalUsers, pendingPosts, totalOrgs } = useMemo(() => ({
    chartData: Array.isArray(timeline) ? timeline : [],
    totalUsers: metrics?.totalUsers ?? aggregates.user.totalUsers,
    pendingPosts: metrics?.pendingPosts ?? metrics?.postsAwaitingModerationCount ?? aggregates.forum.pending,
    totalOrgs: organizations?.length ?? 0,
  }), [timeline, metrics, aggregates, organizations]);

  const donationsFormatted = useMemo(() => {
    const val = metrics?.donationsLast30Days ?? 0;
    return Number(val).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
  }, [metrics?.donationsLast30Days]);

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
            {t('admin:welcome_back', { name: displayName })}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            {t('admin:system_overview_subtitle')}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          {lastRefreshed && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {lastRefreshed.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
          )}
          <Tooltip title={t('admin:refresh_now')}>
            <IconButton
              size="small"
              onClick={handleRefresh}
              sx={{
                color: 'primary.main',
                bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.08),
                border: '1px solid',
                borderColor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.24 : 0.12),
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.14),
                },
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
              bgcolor: 'background.paper',
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
            label={t('admin:total_members')}
            value={totalUsers.toLocaleString()}
            icon={<PeopleAltOutlinedIcon />}
            trend={12}
          />
          <AdminDashboardMetricTile
            label={t('admin:posts_pending_moderation')}
            value={pendingPosts}
            icon={<MarkChatUnreadOutlinedIcon />}
            caption={t('admin:posts_pending_moderation_caption')}
          />
          <AdminDashboardMetricTile
            label={t('admin:organizations_units')}
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
            label={t('admin:system_activity')}
            value={(metrics?.auditLogsCountToday || 0).toLocaleString()}
            icon={<TrendingUpIcon />}
            caption={t('admin:system_activity_caption')}
          />
          <AdminDashboardMetricTile
            label={t('admin:pending_verification')}
            value={(metrics?.pendingVerifications || 0).toLocaleString()}
            icon={<VerifiedUserOutlinedIcon />}
            caption={t('admin:pending_verification_caption')}
          />
          <AdminDashboardMetricTile
            label={t('admin:recent_donations')}
            value={donationsFormatted}
            icon={<VolunteerActivismOutlinedIcon />}
            caption={t('admin:donations_caption', { count: (metrics?.totalDonationsCount || 0).toLocaleString() })}
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
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>{t('admin:activity_chart')}</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>{t('admin:last_7_days')}</Typography>
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
                {t('admin:quick_actions')}
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
                  {t('admin:manage_users')}
                </Button>
                <Button
                  component={NavLink}
                  to="/admin/forum/posts"
                  variant="outlined"
                  fullWidth
                  startIcon={<ForumOutlinedIcon />}
                  sx={{ justifyContent: 'flex-start', py: 1.2, fontWeight: 700, textTransform: 'none', borderRadius: 1 }}
                >
                  {t('admin:moderate_forum_posts')}
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
                  {t('admin:view_audit_logs')}
                </Button>
              </Stack>
            </Box>

            <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>{t('admin:system_status')}</Typography>
              <Stack spacing={2}>
                {SYSTEM_STATUS_ITEMS.map(([label]) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, px: 1, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
                      {t('admin:system_status_stable')}
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
