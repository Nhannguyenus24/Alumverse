import { useTranslation } from 'react-i18next';
import useAdminCohortStats from '../../hooks/admin/useAdminCohortStats';
import { GENDER_OPTIONS, GENDER_LABEL_KEYS, normalizeGender } from '../../constants/gender';

const VERIF_LEVEL_LABELS = {
  0: 'cohort_verif_unverified',
  1: 'cohort_verif_requested',
  2: 'cohort_verif_accepted',
};

// Maps backend Status enum values (Status.java) to i18n keys.
const GRAD_STATUS_LABELS = {
  GRADUATED: 'grad_status_graduated',
  STUDYING: 'grad_status_studying',
  DROPPED: 'grad_status_dropped',
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

  // Merge every raw gender variant (Male/male/nam/empty/...) into the 3 canonical
  // buckets so the chart always shows exactly Male / Female / Other.
  const gender = (() => {
    const counts = { male: 0, female: 0, other: 0 };
    (stats.byGender || []).forEach((s) => {
      counts[normalizeGender(s.name)] += Number(s.value ?? 0);
    });
    return GENDER_OPTIONS.map((g) => ({ name: t(`admin:${GENDER_LABEL_KEYS[g]}`), value: counts[g] }));
  })();

  const gradStatus = (stats.byGraduationStatus || []).map((s) => {
    const key = String(s.name ?? '').toUpperCase();
    return {
      name: GRAD_STATUS_LABELS[key] ? t(`admin:${GRAD_STATUS_LABELS[key]}`) : String(s.name ?? '—'),
      value: Number(s.value ?? 0),
    };
  });

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
          <Chart type="pie" data={gradStatus} dataKey="value" xAxisKey="name" height={260} showTable />
        </ChartCard>
        <ChartCard title={t('admin:cohort_by_gender')}>
          <Chart type="pie" data={gender} dataKey="value" xAxisKey="name" height={260} showTable />
        </ChartCard>
        <ChartCard title={t('admin:cohort_by_age')}>
          <Chart type="bar" data={points(stats.byAgeBucket)} dataKey="value" xAxisKey="name" height={260} showLegend={false} />
        </ChartCard>
        <ChartCard title={t('admin:cohort_by_verification')}>
          <Chart type="pie" data={verifLevels} dataKey="value" xAxisKey="name" height={260} showTable />
        </ChartCard>
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminCohortSection;
