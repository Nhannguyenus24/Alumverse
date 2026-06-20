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

const AdminFundraisingSection = () => {
  const { stats } = useAdminFundraisingStats();

  const donationStatusData = [
    { name: 'Thành công', count: Number(stats.successfulDonations) },
    { name: 'Chờ xử lý', count: Number(stats.pendingDonations) },
    { name: 'Thất bại', count: Number(stats.failedDonations) },
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
      title="Quyên góp & Gây quỹ"
      subtitle="Tổng quan chiến dịch, lượt quyên góp và timeline 30 ngày."
    >
      <Stack spacing={3}>
        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label="Tổng số chiến dịch" value={fmt(stats.totalFunds)} icon={<VolunteerActivismOutlinedIcon />} />
            <AdminDashboardMetricTile label="Đang hoạt động" value={fmt(stats.activeFunds)} icon={<PlayCircleOutlineOutlinedIcon />} />
            <AdminDashboardMetricTile label="Đã kết thúc" value={fmt(stats.completedFunds)} icon={<TaskAltOutlinedIcon />} />
          </Stack>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label="Tổng số mục tiêu" value={fmtMoney(stats.totalTarget)} icon={<TrackChangesOutlinedIcon />} />
            <AdminDashboardMetricTile label="Đã gây quỹ" value={fmtMoney(stats.totalRaised)} icon={<SavingsOutlinedIcon />} />
            <AdminDashboardMetricTile label="Lượt quyên góp" value={fmt(stats.totalDonations)} icon={<FavoriteBorderOutlinedIcon />} />
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box flex={2} minWidth={0}>
            <Chart
              type="line"
              title="Lượt quyên góp theo ngày (30 ngày qua)"
              data={timelineData}
              dataKey="count"
              xAxisKey="date"
              height={260}
            />
          </Box>
          <Box flex={1} minWidth={0}>
            <Chart
              type="bar"
              title="Lượt quyên góp theo trạng thái"
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
              Top chiến dịch theo số tiền gây quỹ
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
