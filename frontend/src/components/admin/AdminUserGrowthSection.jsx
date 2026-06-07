import { Stack } from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';
import useAdminUserGrowthStats from '../../hooks/admin/useAdminUserGrowthStats';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const AdminUserGrowthSection = () => {
  const { stats } = useAdminUserGrowthStats();

  const fmtDate = (str) => {
    const p = String(str ?? '').slice(0, 10).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}` : str;
  };

  const dailyData = (stats.dailyRegistrations || []).map((d) => ({
    date: fmtDate(d.date), count: Number(d.count ?? 0),
  }));

  return (
    <AdminSectionPanel
      title="Tăng trưởng người dùng"
      subtitle="Đăng ký mới theo ngày và phân loại trạng thái tài khoản."
    >
      <Stack spacing={3}>
        <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
          <AdminDashboardMetricTile
            label="Mới (7 ngày)"
            value={Number(stats.newUsersLast7Days).toLocaleString()}
            icon={<PersonAddOutlinedIcon />}
          />
          <AdminDashboardMetricTile
            label="Mới (30 ngày)"
            value={Number(stats.newUsersLast30Days).toLocaleString()}
          />
          <AdminDashboardMetricTile
            label="Đang hoạt động"
            value={Number(stats.totalActiveUsers).toLocaleString()}
          />
          <AdminDashboardMetricTile
            label="Đã khóa"
            value={Number(stats.totalBannedUsers).toLocaleString()}
          />
          <AdminDashboardMetricTile
            label="Đã xóa"
            value={Number(stats.totalDeletedUsers).toLocaleString()}
          />
        </Stack>

        <Chart
          type="line"
          title="Đăng ký mới theo ngày (30 ngày qua)"
          data={dailyData}
          dataKey="count"
          xAxisKey="date"
          height={280}
        />
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminUserGrowthSection;
