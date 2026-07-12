import { useTranslation } from 'react-i18next';
import useAdminSecurityStats from '../../hooks/admin/useAdminSecurityStats';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const AdminSecuritySection = () => {
  const { t } = useTranslation('admin');
  const { loginStats, suspiciousLogins } = useAdminSecurityStats();

  const fmtDate = (str) => {
    const p = String(str ?? '').slice(0, 10).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}` : str;
  };

  const dailyData = (loginStats.dailyStats || [])
    .map((d) => ({ date: fmtDate(d.date), count: Number(d.count ?? 0) }))
    .reverse();

  const methodData = (loginStats.methodStats || []).map((m) => ({
    name: m.method || t('admin:security_method_other'),
    count: Number(m.count ?? 0),
  }));

  const totalLogins30d = dailyData.reduce((sum, d) => sum + d.count, 0);
  const suspiciousCount = Array.isArray(suspiciousLogins) ? suspiciousLogins.length : 0;

  return (
    <AdminSectionPanel
      title={t('admin:security_section_title')}
      subtitle={t('admin:security_section_subtitle')}
    >
      <Stack spacing={3}>
        <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
          <AdminDashboardMetricTile
            label={t('admin:security_logins_label')}
            value={totalLogins30d.toLocaleString()}
            icon={<SecurityOutlinedIcon />}
            caption={t('admin:security_logins_30d_caption')}
          />
          <AdminDashboardMetricTile
            label={t('admin:security_suspicious_ip_label')}
            value={suspiciousCount.toLocaleString()}
            caption={suspiciousCount > 0 ? t('admin:security_suspicious_needs_review') : t('admin:security_no_anomalies')}
            icon={<TravelExploreOutlinedIcon />}
          />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box flex={2} minWidth={0}>
            <Chart
              type="line"
              title={t('admin:security_chart_daily_logins_title')}
              data={dailyData}
              dataKey="count"
              xAxisKey="date"
              height={260}
            />
          </Box>
          <Box flex={1} minWidth={0}>
            <Chart
              type="bar"
              title={t('admin:security_chart_login_methods_title')}
              data={methodData}
              dataKey="count"
              xAxisKey="name"
              height={260}
            />
          </Box>
        </Stack>
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminSecuritySection;
