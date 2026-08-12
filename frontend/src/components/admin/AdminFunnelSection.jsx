import { useTranslation } from 'react-i18next';
import { Box, Stack, Typography } from '@mui/material';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import SupervisorAccountOutlinedIcon from '@mui/icons-material/SupervisorAccountOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';
import useAdminFunnelStats from '../../hooks/admin/useAdminFunnelStats';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const pct = (n) => `${Number(n ?? 0).toFixed(1)}%`;

const AdminFunnelSection = ({ from, to }) => {
  const { t } = useTranslation(['admin']);
  const { stats } = useAdminFunnelStats(from, to);

  // Translate the backend stage keys into localized funnel labels.
  const toFunnel = (stages) =>
    (stages || []).map((s) => ({ name: t(`admin:funnel_${s.name}`), value: Number(s.value ?? 0) }));

  const funnels = [
    { key: 'verification', title: t('admin:funnel_verification_title'), data: toFunnel(stats.verification) },
    { key: 'event', title: t('admin:funnel_event_title'), data: toFunnel(stats.event) },
    { key: 'donation', title: t('admin:funnel_donation_title'), data: toFunnel(stats.donation) },
    { key: 'mentorshipSession', title: t('admin:funnel_session_title'), data: toFunnel(stats.mentorshipSession) },
  ];

  return (
    <AdminSectionPanel
      title={t('admin:funnel_section_title')}
      subtitle={t('admin:funnel_section_subtitle')}
    >
      <Stack spacing={3}>
        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label={t('admin:rate_verification')} value={pct(stats.verificationRate)} icon={<VerifiedUserOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:rate_event_checkin')} value={pct(stats.eventCheckinRate)} icon={<MeetingRoomOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:rate_event_capacity')} value={pct(stats.eventCapacityFillRate)} icon={<EventAvailableOutlinedIcon />} />
          </Stack>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label={t('admin:rate_donation_success')} value={pct(stats.donationSuccessRate)} icon={<VolunteerActivismOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:rate_mentor_approval')} value={pct(stats.mentorApprovalRate)} icon={<SupervisorAccountOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:rate_session_completion')} value={pct(stats.sessionCompletionRate)} icon={<TaskAltOutlinedIcon />} />
          </Stack>
        </Stack>

        <Stack direction="row" flexWrap="wrap" spacing={3} useFlexGap>
          {funnels.map((f) => (
            <Box key={f.key} sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' }, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                {f.title}
              </Typography>
              <Chart
                type="funnel"
                data={f.data}
                dataKey="value"
                xAxisKey="name"
                height={260}
                showLegend={false}
              />
            </Box>
          ))}
        </Stack>
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminFunnelSection;
