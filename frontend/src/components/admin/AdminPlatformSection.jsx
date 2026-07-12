import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import useAdminPlatformStats from '../../hooks/admin/useAdminPlatformStats';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const fmt = (n) => Number(n ?? 0).toLocaleString('vi-VN');
const points = (arr) => (arr || []).map((s) => ({ name: String(s.name ?? '—'), value: Number(s.value ?? 0) }));

const fmtDate = (str) => {
  const p = String(str ?? '').split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}` : str;
};

const AdminPlatformSection = () => {
  const { t } = useTranslation(['admin']);
  const theme = useTheme();
  const { stats } = useAdminPlatformStats();
  const { chat, orgComparison, quality } = stats;

  const messagesByDay = (chat?.messagesByDay || []).map((s) => ({ name: fmtDate(s.name), value: Number(s.value ?? 0) }));
  const orgData = (orgComparison || []).map((o) => ({
    name: o.name,
    members: Number(o.members ?? 0),
    events: Number(o.events ?? 0),
    topics: Number(o.topics ?? 0),
    jobs: Number(o.jobs ?? 0),
  }));

  const orgKeys = [
    { key: 'members', label: t('admin:org_metric_members') },
    { key: 'events', label: t('admin:org_metric_events') },
    { key: 'topics', label: t('admin:org_metric_topics') },
    { key: 'jobs', label: t('admin:org_metric_jobs') },
  ];

  return (
    <AdminSectionPanel
      title={t('admin:platform_section_title')}
      subtitle={t('admin:platform_section_subtitle')}
    >
      <Stack spacing={4}>
        {/* Chat / messaging health */}
        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label={t('admin:metric_total_messages')} value={fmt(chat?.totalMessages)} icon={<ChatBubbleOutlineOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:metric_total_chat_groups')} value={fmt(chat?.totalGroups)} icon={<GroupsOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:metric_total_blocks')} value={fmt(chat?.totalBlocks)} icon={<BlockOutlinedIcon />} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <Box flex={2} minWidth={0}>
              <Chart type="area" title={t('admin:chart_messages_by_day_14d')} data={messagesByDay} dataKey="value" xAxisKey="name" height={260} />
            </Box>
            <Box flex={1} minWidth={0}>
              <Chart type="pie" title={t('admin:chart_chat_groups_by_type')} data={points(chat?.groupsByType)} dataKey="value" xAxisKey="name" height={260} showTable />
            </Box>
          </Stack>
        </Stack>

        {/* Cross-organization comparison */}
        <Chart
          type="bar"
          title={t('admin:chart_org_comparison')}
          data={orgData}
          dataKeys={orgKeys}
          xAxisKey="name"
          height={300}
        />

        {/* Service quality */}
        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile
              label={t('admin:metric_avg_rating')}
              value={`${Number(quality?.avgSessionRating ?? 0).toFixed(2)} / 5`}
              icon={<StarOutlineOutlinedIcon />}
            />
          </Stack>
          <Stack direction="row" flexWrap="wrap" spacing={3} useFlexGap>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33% - 16px)' }, minWidth: 0 }}>
              <Chart type="bar" title={t('admin:chart_rating_distribution')} data={points(quality?.ratingDistribution)} dataKey="value" xAxisKey="name" height={240} showLegend={false} color={theme.palette.warning.main} />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33% - 16px)' }, minWidth: 0 }}>
              <Chart type="bar" title={t('admin:chart_mentor_reports')} data={points(quality?.mentorReportsByStatus)} dataKey="value" xAxisKey="name" height={240} showLegend={false} color={theme.palette.error.main} />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33% - 16px)' }, minWidth: 0 }}>
              <Chart type="bar" title={t('admin:chart_forum_reports')} data={points(quality?.forumReportsByStatus)} dataKey="value" xAxisKey="name" height={240} showLegend={false} color={theme.palette.error.main} />
            </Box>
          </Stack>
        </Stack>
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminPlatformSection;
