import { Stack } from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
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
        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile
              label="Người dùng mới trong tuần"
              value={Number(stats.newUsersLast7Days).toLocaleString()}
              caption="Trong 7 ngày qua"
              icon={<PersonAddOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label="Người dùng mới trong tháng"
              value={Number(stats.newUsersLast30Days).toLocaleString()}
              caption="Trong 30 ngày qua"
              icon={<CalendarMonthOutlinedIcon />}
            />
          </Stack>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile
              label="Đang hoạt động"
              value={Number(stats.totalActiveUsers).toLocaleString()}
              icon={<CheckCircleOutlineOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label="Đã khóa"
              value={Number(stats.totalBannedUsers).toLocaleString()}
              icon={<BlockOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label="Đã xóa"
              value={Number(stats.totalDeletedUsers).toLocaleString()}
              icon={<DeleteOutlineOutlinedIcon />}
            />
          </Stack>
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
