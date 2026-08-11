import { useTranslation } from 'react-i18next';
import { Box, Stack, Typography } from '@mui/material';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';
import useAdminFundraisingStats from '../../hooks/admin/useAdminFundraisingStats';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const fmt = (n) => Number(n ?? 0).toLocaleString('vi-VN');
const fmtMoney = (n) =>
  Number(n ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

const AdminFundraisingSection = ({ from, to }) => {
  const { t } = useTranslation(['admin', 'donation']);
  const { stats } = useAdminFundraisingStats(from, to);

  const donationStatusData = [
    { name: t('donation:status_success'), count: Number(stats.successfulDonations) },
    { name: t('donation:status_pending'), count: Number(stats.pendingDonations) },
    { name: t('donation:status_failed'), count: Number(stats.failedDonations) },
  ];

  const fmtDate = (str) => {
    const p = String(str ?? '').slice(0, 10).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}` : str;
  };

  const timelineData = (stats.donationTimeline || []).map((d) => ({
    date: fmtDate(d.date), count: Number(d.count ?? 0),
  }));

  return (
    <AdminSectionPanel
      title={t('admin:fundraising_section_title')}
      subtitle={t('admin:fundraising_section_subtitle')}
    >
      <Stack spacing={3}>
        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label={t('admin:metric_total_campaigns')} value={fmt(stats.totalFunds)} icon={<VolunteerActivismOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:metric_active_campaigns')} value={fmt(stats.activeFunds)} icon={<PlayCircleOutlineOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:metric_completed_campaigns')} value={fmt(stats.completedFunds)} icon={<TaskAltOutlinedIcon />} />
          </Stack>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label={t('admin:metric_total_target')} value={fmtMoney(stats.totalTarget)} icon={<TrackChangesOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:metric_total_raised')} value={fmtMoney(stats.totalRaised)} icon={<SavingsOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:metric_total_donations')} value={fmt(stats.totalDonations)} icon={<FavoriteBorderOutlinedIcon />} />
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box flex={2} minWidth={0}>
            <Chart
              type="line"
              title={t('admin:chart_donations_by_day_30d')}
              data={timelineData}
              dataKey="count"
              xAxisKey="date"
              height={260}
            />
          </Box>
          <Box flex={1} minWidth={0}>
            <Chart
              type="bar"
              title={t('admin:chart_donations_by_status')}
              data={donationStatusData}
              dataKey="count"
              xAxisKey="name"
              height={260}
            />
          </Box>
        </Stack>

        {(stats.topFundsByRaised || []).length > 0 && (
          <Box sx={{ p: 2.5, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              {t('admin:top_campaigns_by_raised')}
            </Typography>
            {stats.topFundsByRaised.slice(0, 5).map((fund, i) => (
              <Box
                key={fund.fundId ?? i}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                  borderBottom: i < Math.min(stats.topFundsByRaised.length, 5) - 1 ? 1 : 0,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" sx={{ flex: 1, mr: 1, fontWeight: 600 }} noWrap>
                  {i + 1}. {fund.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ flexShrink: 0 }}>
                  {fmtMoney(fund.currentAmount)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminFundraisingSection;
