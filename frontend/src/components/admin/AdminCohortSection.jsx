import { useTranslation } from 'react-i18next';
import { Box, Stack, Typography } from '@mui/material';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import useAdminCohortStats from '../../hooks/admin/useAdminCohortStats';

const VERIF_LEVEL_LABELS = {
  0: 'cohort_verif_unverified',
  1: 'cohort_verif_requested',
  2: 'cohort_verif_accepted',
};

const ChartCard = ({ title, children }) => (
  <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' }, minWidth: 0 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
      {title}
    </Typography>
    {children}
  </Box>
);

const AdminCohortSection = () => {
  const { t } = useTranslation(['admin']);
  const { stats } = useAdminCohortStats();

  const points = (arr) => (arr || []).map((s) => ({ name: String(s.name ?? '—'), value: Number(s.value ?? 0) }));

  const verifLevels = (stats.byVerificationLevel || []).map((s) => ({
    name: VERIF_LEVEL_LABELS[s.name] ? t(`admin:${VERIF_LEVEL_LABELS[s.name]}`) : String(s.name),
    value: Number(s.value ?? 0),
  }));

  return (
    <AdminSectionPanel
      title={t('admin:cohort_section_title')}
      subtitle={t('admin:cohort_section_subtitle')}
    >
      <Stack direction="row" flexWrap="wrap" spacing={3} useFlexGap>
        <ChartCard title={t('admin:cohort_by_started_year')}>
          <Chart type="bar" data={points(stats.byStartedYear)} dataKey="value" xAxisKey="name" height={260} showLegend={false} />
        </ChartCard>
        <ChartCard title={t('admin:cohort_by_graduated_year')}>
          <Chart type="bar" data={points(stats.byGraduatedYear)} dataKey="value" xAxisKey="name" height={260} showLegend={false} />
        </ChartCard>
        <ChartCard title={t('admin:cohort_by_graduation_status')}>
          <Chart type="pie" data={points(stats.byGraduationStatus)} dataKey="value" xAxisKey="name" height={260} />
        </ChartCard>
        <ChartCard title={t('admin:cohort_by_gender')}>
          <Chart type="pie" data={points(stats.byGender)} dataKey="value" xAxisKey="name" height={260} />
        </ChartCard>
        <ChartCard title={t('admin:cohort_by_age')}>
          <Chart type="bar" data={points(stats.byAgeBucket)} dataKey="value" xAxisKey="name" height={260} showLegend={false} />
        </ChartCard>
        <ChartCard title={t('admin:cohort_by_verification')}>
          <Chart type="pie" data={verifLevels} dataKey="value" xAxisKey="name" height={260} />
        </ChartCard>
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminCohortSection;
