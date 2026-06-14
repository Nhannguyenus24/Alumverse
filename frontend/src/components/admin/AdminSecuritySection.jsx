import { Box, Stack } from '@mui/material';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';
import useAdminSecurityStats from '../../hooks/admin/useAdminSecurityStats';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const AdminSecuritySection = () => {
  const { loginStats, suspiciousLogins } = useAdminSecurityStats();

  const fmtDate = (str) => {
    const p = String(str ?? '').slice(0, 10).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}` : str;
  };

  const dailyData = (loginStats.dailyStats || [])
    .map((d) => ({ date: fmtDate(d.date), count: Number(d.count ?? 0) }))
    .reverse();

  const methodData = (loginStats.methodStats || []).map((m) => ({
    name: m.method || 'Khác',
    count: Number(m.count ?? 0),
  }));

  const totalLogins30d = dailyData.reduce((sum, d) => sum + d.count, 0);
  const suspiciousCount = Array.isArray(suspiciousLogins) ? suspiciousLogins.length : 0;

  return (
    <AdminSectionPanel
      title="Bảo mật & Kiểm toán"
      subtitle="Lịch sử đăng nhập, phương thức xác thực và các tài khoản đáng ngờ."
    >
      <Stack spacing={3}>
        <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
          <AdminDashboardMetricTile
            label="Đăng nhập (30 ngày)"
            value={totalLogins30d.toLocaleString()}
            icon={<SecurityOutlinedIcon />}
          />
          <AdminDashboardMetricTile
            label="IP đáng ngờ (7 ngày)"
            value={suspiciousCount.toLocaleString()}
            caption={suspiciousCount > 0 ? 'Cần kiểm tra ngay' : 'Không có bất thường'}
          />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box flex={2} minWidth={0}>
            <Chart
              type="line"
              title="Đăng nhập theo ngày (30 ngày qua)"
              data={dailyData}
              dataKey="count"
              xAxisKey="date"
              height={260}
            />
          </Box>
          <Box flex={1} minWidth={0}>
            <Chart
              type="bar"
              title="Phương thức đăng nhập"
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
