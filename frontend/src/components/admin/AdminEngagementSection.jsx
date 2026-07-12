import { useTranslation } from 'react-i18next';
import useAdminEngagementStats from '../../hooks/admin/useAdminEngagementStats';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const fmt = (n) => Number(n ?? 0).toLocaleString('vi-VN');

const AdminEngagementSection = () => {
  const { t } = useTranslation(['admin']);
  const { stats } = useAdminEngagementStats();

  const byHour = (stats.loginsByHour || []).map((s) => ({ name: `${s.name}h`, value: Number(s.value ?? 0) }));
  const byMethod = (stats.loginsByMethod || []).map((s) => ({ name: String(s.name ?? '—'), value: Number(s.value ?? 0) }));

  const dailyLogins = [...(stats.dailyLogins || [])]
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .map((s) => {
      const p = String(s.name ?? '').split('-');
      return { name: p.length === 3 ? `${p[2]}/${p[1]}` : s.name, value: Number(s.value ?? 0) };
    });

  return (
    <AdminSectionPanel
      title={t('admin:engagement_section_title')}
      subtitle={t('admin:engagement_section_subtitle')}
    >
      <Stack spacing={3}>
        <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
          <AdminDashboardMetricTile label={t('admin:metric_dau')} value={fmt(stats.dailyActiveUsers)} icon={<TodayOutlinedIcon />} caption={t('admin:metric_dau_caption')} />
          <AdminDashboardMetricTile label={t('admin:metric_wau')} value={fmt(stats.weeklyActiveUsers)} icon={<DateRangeOutlinedIcon />} caption={t('admin:metric_wau_caption')} />
          <AdminDashboardMetricTile label={t('admin:metric_mau')} value={fmt(stats.monthlyActiveUsers)} icon={<CalendarMonthOutlinedIcon />} caption={t('admin:metric_mau_caption')} />
          <AdminDashboardMetricTile label={t('admin:metric_stickiness')} value={`${Number(stats.stickiness ?? 0).toFixed(1)}%`} icon={<InsightsOutlinedIcon />} caption={t('admin:metric_stickiness_caption')} />
        </Stack>

        <Chart
          type="area"
          title={t('admin:chart_daily_logins_30d')}
          data={dailyLogins}
          dataKey="value"
          xAxisKey="name"
          height={280}
        />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box flex={2} minWidth={0}>
            <Chart
              type="bar"
              title={t('admin:chart_logins_by_hour')}
              data={byHour}
              dataKey="value"
              xAxisKey="name"
              height={260}
              showLegend={false}
            />
          </Box>
          <Box flex={1} minWidth={0}>
            <Chart
              type="pie"
              title={t('admin:chart_logins_by_method')}
              data={byMethod}
              dataKey="value"
              xAxisKey="name"
              height={260}
              showTable
            />
          </Box>
        </Stack>
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminEngagementSection;
