import { useMemo } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { NavLink } from 'react-router';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import Chart from '../../components/Chart';
import { useAdminSystemContext } from '../../contexts/AdminSystemContext';
import { useAdminForumContext } from '../../contexts/AdminForumContext';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const MONTH_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const AdminAnalyticsPage = () => {
  const { loading, metrics, auditLogs } = useAdminSystemContext();
  const {
    statistics,
    topContributors,
    organizationEngagement,
    monthlyTimeline,
    contributorMonth,
    setContributorMonth,
    contributorYear,
    setContributorYear,
    timelineYear,
    setTimelineYear,
  } = useAdminForumContext();

  /* ─── Transform engagement data for bar chart ─── */
  const engagementChartData = useMemo(() => {
    if (!Array.isArray(organizationEngagement)) return [];
    return organizationEngagement.map((org) => ({
      name: org.organizationName || `Org #${org.organizationId}`,
      totalMembers: org.totalMembers ?? 0,
      activeForumUsers: org.activeForumUsers ?? 0,
      engagementRate:
        org.totalMembers > 0
          ? Number(((org.activeForumUsers / org.totalMembers) * 100).toFixed(1))
          : 0,
    }));
  }, [organizationEngagement]);

  /* ─── Transform timeline data for multi-line chart ─── */
  const timelineChartData = useMemo(() => {
    if (!monthlyTimeline?.months) return [];
    return monthlyTimeline.months.map((m) => ({
      month: MONTH_NAMES[m.month] || m.month,
      activeUsers: m.activeUsers ?? 0,
      postCount: m.postCount ?? 0,
      topicCount: m.topicCount ?? 0,
    }));
  }, [monthlyTimeline]);

  return (
    <Stack spacing={2.5}>
      {/* ─── Section 1: System summary + Forum statistics ─── */}
      <AdminSectionPanel
        title="Analytics & reports"
        subtitle="Comprehensive forum analytics powered by backend API data."
      >
        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : (
          <>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 1.5 }}>
                System Overview
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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

            {/* Forum Statistics Overview */}
            {statistics && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                  Forum Statistics Overview
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                  <AdminDashboardMetricTile label="Total topics" value={statistics.totalTopics ?? 0} valueColor="primary.main" />
                  <AdminDashboardMetricTile label="Total posts" value={statistics.totalPosts ?? 0} valueColor="info.main" />
                  <AdminDashboardMetricTile label="Total categories" value={statistics.totalCategories ?? 0} valueColor="info.dark" />
                  <AdminDashboardMetricTile label="Banned posts" value={statistics.bannedPosts ?? 0} valueColor="error.main" />
                  <AdminDashboardMetricTile label="New topics today" value={statistics.newTopicsToday ?? 0} valueColor="success.main" />
                  <AdminDashboardMetricTile label="New posts today" value={statistics.newPostsToday ?? 0} valueColor="success.dark" />
                </Box>
              </>
            )}
          </>
        )}
      </AdminSectionPanel>

      {/* ─── Section 2: Top Contributors ─── */}
      <AdminSectionPanel
        title="Top 10 contributors"
        subtitle="Users with the most posts this period."
        action={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label="Month"
              value={contributorMonth}
              onChange={(e) => setContributorMonth?.(Number(e.target.value))}
              sx={{ minWidth: 130 }}
            >
              {MONTHS.map((m) => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Year"
              value={contributorYear}
              onChange={(e) => setContributorYear?.(Number(e.target.value))}
              sx={{ minWidth: 100 }}
            >
              {YEARS.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
          </Box>
        }
      >
        {(!topContributors || topContributors.length === 0) ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No contributor data available for the selected period.
          </Typography>
        ) : (
          <List
            dense
            disablePadding
            sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}
          >
            {topContributors.map((tc, idx) => (
              <ListItem
                key={tc.memberId || idx}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                <ListItemAvatar>
                  <Avatar src={tc.avatarUrl} sx={{ width: 36, height: 36 }}>
                    {(tc.userName || '?')[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {idx + 1}. {tc.userName || '-'}
                      </Typography>
                      <Chip label={`${tc.postCount ?? 0} posts`} size="small" color="primary" variant="outlined" />
                    </Box>
                  }
                  secondary={tc.email || '-'}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </AdminSectionPanel>

      {/* ─── Section 3: Organization Engagement ─── */}
      <AdminSectionPanel
        title="Organization engagement"
        subtitle="Active forum users vs total members per organization."
      >
        {engagementChartData.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No engagement data available.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'stretch' }}>
            <Box sx={{ flex: '1 1 400px', minWidth: 300 }}>
              <Chart
                type="bar"
                title="Engagement: Active users vs Total members"
                data={engagementChartData}
                dataKeys={[
                  { key: 'totalMembers', label: 'Total Members', color: '#90caf9' },
                  { key: 'activeForumUsers', label: 'Active Forum Users', color: '#1976d2' },
                ]}
                xAxisKey="name"
                height={300}
              />
            </Box>
            <Box sx={{ flex: '1 1 400px', minWidth: 300 }}>
              <Chart
                type="bar"
                title="Engagement rate (%)"
                data={engagementChartData}
                dataKey="engagementRate"
                xAxisKey="name"
                height={300}
              />
            </Box>
          </Box>
        )}
      </AdminSectionPanel>

      {/* ─── Section 4: Monthly Activity Timeline ─── */}
      <AdminSectionPanel
        title="Monthly activity timeline"
        subtitle="Active users, posts, and topics per month."
        action={
          <TextField
            select
            size="small"
            label="Year"
            value={timelineYear}
            onChange={(e) => setTimelineYear?.(Number(e.target.value))}
            sx={{ minWidth: 100 }}
          >
            {YEARS.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>
        }
      >
        {timelineChartData.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No timeline data available for {timelineYear}.
          </Typography>
        ) : (
          <Chart
            type="line"
            title={`Activity in ${timelineYear}`}
            data={timelineChartData}
            dataKeys={[
              { key: 'activeUsers', label: 'Active Users', color: '#1976d2' },
              { key: 'postCount', label: 'Posts', color: '#2e7d32' },
              { key: 'topicCount', label: 'Topics', color: '#ed6c02' },
            ]}
            xAxisKey="month"
            height={320}
          />
        )}
      </AdminSectionPanel>

      {/* ─── Section 5: Ghost Topics ─── */}
      {statistics?.ghostTopics && statistics.ghostTopics.length > 0 && (
        <AdminSectionPanel
          title="Ghost topics"
          subtitle="Topics with no replies for 7+ days — may need attention."
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <WarningAmberOutlinedIcon sx={{ color: 'warning.main' }} />
            <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 600 }}>
              {statistics.ghostTopics.length} ghost topic{statistics.ghostTopics.length !== 1 ? 's' : ''} detected
            </Typography>
          </Box>
          <List
            dense
            disablePadding
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            {statistics.ghostTopics.map((gt, i) => (
              <ListItem
                key={gt.id || gt.topicId || i}
                sx={{ borderBottom: 1, borderColor: 'divider', '&:last-of-type': { borderBottom: 'none' } }}
              >
                <ListItemText
                  primary={gt.title || gt.topicTitle || `Topic #${gt.id || gt.topicId}`}
                  secondary={`Views: ${gt.viewCount ?? 0} · Created: ${gt.createdAt ? new Date(gt.createdAt).toLocaleDateString('vi-VN') : '-'}`}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        </AdminSectionPanel>
      )}
    </Stack>
  );
};

export default AdminAnalyticsPage;
