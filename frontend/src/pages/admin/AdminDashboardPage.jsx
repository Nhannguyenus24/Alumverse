import { useCallback, useEffect, useState, useMemo } from 'react';
import { NavLink, useOutletContext } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Box, Button, Skeleton, Stack, Typography, alpha, useTheme,
} from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import MarkChatUnreadOutlinedIcon from '@mui/icons-material/MarkChatUnreadOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import AdminDashboardSections from '../../components/admin/AdminDashboardSections';
import TimeRangeControls from '../../components/admin/TimeRangeControls';
import Chart from '../../components/Chart';
import { useAdminSystemContext, useAdminForumContext } from '../../stores/AdminStore';
import useAdminDashboardAggregates from '../../hooks/admin/useAdminDashboardAggregates';
import useAdminDashboardData from '../../hooks/admin/useAdminDashboardData';
import useTimeRange from '../../hooks/admin/useTimeRange';
import { getUsers, getAllPosts } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { useMyProfile } from '../../hooks/profile/useMyProfile';

const parseList = (res) => {
  const data = res?.data?.data ?? res?.data ?? res ?? [];
  return Array.isArray(data) ? data : (data?.items || data?.content || []);
};

const AdminDashboardPage = () => {
  const theme = useTheme();
  const { t } = useTranslation(['admin']);
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const isAdmin = user?.role === 'ADMIN';
  const { loading: systemLoading, organizations } = useAdminSystemContext();
  const { statistics } = useAdminForumContext();

  const {
    timeRange, setTimeRange,
    customStart, setCustomStart,
    customEnd, setCustomEnd,
    refreshInterval, setRefreshInterval,
    from, to,
    refresh, refreshTick,
  } = useTimeRange({ defaultRange: '30d' });

  const { loading: dashboardLoading, metrics, timeline, reload } = useAdminDashboardData(from, to);

  const [allUsers, setAllUsers] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [fetchingAll, setFetchingAll] = useState(true);

  // Full user/post lists are filtered client-side for the Users/Forum aggregates.
  // They don't depend on the time range (no date params on these endpoints), so we
  // only re-pull them on mount and on a refresh tick (manual button / auto-refresh).
  // State is only touched in the async resolution to avoid synchronous setState in
  // the effect body.
  const fetchAll = useCallback(() => Promise.all([
    getUsers(0, 10000, '', 'ALL', 'ALL', null).catch(() => ({ data: { data: [] } })),
    getAllPosts('', 0, 10000, null).catch(() => ({ data: { data: [] } })),
  ]).then(([usersRes, postsRes]) => {
    setAllUsers(parseList(usersRes));
    setAllPosts(parseList(postsRes));
    setFetchingAll(false);
  }), []);

  useEffect(() => {
    let mounted = true;
    fetchAll().catch(() => { if (mounted) setFetchingAll(false); });
    return () => { mounted = false; };
    // refreshTick drives manual + auto refresh; the metrics hook reloads on from/to.
  }, [fetchAll, refreshTick]);

  const loading = systemLoading || dashboardLoading || fetchingAll;
  const aggregates = useAdminDashboardAggregates(allUsers, allPosts, organizations, from, to);
  const { setBreadcrumbs, adminBase } = useOutletContext();
  const displayName =
    profile?.fullName ||
    profile?.name ||
    user?.fullName ||
    user?.name ||
    profile?.studentId ||
    user?.studentId ||
    'ADMIN';

  const SYSTEM_STATUS_ITEMS = useMemo(() => [
    [t('admin:system_db')],
    [t('admin:system_email')],
    [t('admin:system_image_storage')],
  ], [t]);

  useEffect(() => {
    setBreadcrumbs?.([{ label: t('admin:breadcrumb_dashboard'), active: true }]);
  }, [setBreadcrumbs, t]);

  const handleRefresh = useCallback(() => {
    reload?.();
    refresh();
  }, [reload, refresh]);

  const rangeLabel = useMemo(
    () => (timeRange === 'custom'
      ? t('admin:dashboard_range.custom_range')
      : t(`admin:dashboard_range.last_${timeRange}`)),
    [timeRange, t],
  );

  const { chartData, totalUsers, pendingPosts, totalOrgs, memberTrend } = useMemo(() => {
    const total = metrics?.totalUsers ?? aggregates.user.totalUsers;
    const newUsersRange = Number(metrics?.newUsers?.range ?? metrics?.newUsers?.['30d'] ?? 0);
    // Growth of the selected window over the prior member base. null hides the chip
    // when there is no history to compare against (avoids a fabricated number).
    const priorBase = Number(total) - newUsersRange;
    const trend = priorBase > 0 ? Math.round((newUsersRange / priorBase) * 100) : null;
    return {
      chartData: Array.isArray(timeline) ? timeline : [],
      totalUsers: total,
      pendingPosts: metrics?.pendingPosts ?? metrics?.postsAwaitingModerationCount ?? aggregates.forum.pending,
      totalOrgs: organizations?.length ?? 0,
      memberTrend: trend,
    };
  }, [timeline, metrics, aggregates, organizations]);

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
      {/* Welcome Header + Time-range Controls */}
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

        <TimeRangeControls
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
          refreshInterval={refreshInterval}
          setRefreshInterval={setRefreshInterval}
          onRefresh={handleRefresh}
          loading={dashboardLoading}
        />
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
            trend={memberTrend}
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
            caption={t('admin:organizations_units_caption')}
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
            value={(metrics?.dailyActive ?? metrics?.auditLogsCountToday ?? 0).toLocaleString()}
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
              <Typography variant="caption" color="text.secondary" fontWeight={600}>{rangeLabel}</Typography>
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
                  to={isAdmin ? `${adminBase}/users` : `${adminBase}/events`}
                  variant="outlined"
                  fullWidth
                  startIcon={isAdmin ? <GroupsOutlinedIcon /> : <EventNoteOutlinedIcon />}
                  sx={{ justifyContent: 'flex-start', py: 1.2, fontWeight: 700, textTransform: 'none', borderRadius: 1 }}
                >
                  {isAdmin ? t('admin:manage_users') : t('admin:nav_events')}
                </Button>
                <Button
                  component={NavLink}
                  to={`${adminBase}/forum/posts`}
                  variant="outlined"
                  fullWidth
                  startIcon={<ForumOutlinedIcon />}
                  sx={{ justifyContent: 'flex-start', py: 1.2, fontWeight: 700, textTransform: 'none', borderRadius: 1 }}
                >
                  {t('admin:moderate_forum_posts')}
                </Button>
                <Button
                  component={NavLink}
                  to={isAdmin ? `${adminBase}/audit-logs` : `${adminBase}/article`}
                  variant="outlined"
                  fullWidth
                  startIcon={isAdmin ? <GavelOutlinedIcon /> : <ArticleOutlinedIcon />}
                  sx={{ justifyContent: 'flex-start', py: 1.2, fontWeight: 700, textTransform: 'none', borderRadius: 1 }}
                >
                  {isAdmin ? t('admin:view_audit_logs') : t('admin:nav_article')}
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
        key={refreshTick}
        aggregates={aggregates}
        forumStats={statistics}
        from={from}
        to={to}
      />
    </Stack>
  );
};

export default AdminDashboardPage;
