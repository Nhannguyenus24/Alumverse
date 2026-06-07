import { Stack } from '@mui/material';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';
import useAdminMentorshipStats from '../../hooks/admin/useAdminMentorshipStats';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const AdminMentorshipSection = () => {
  const { stats } = useAdminMentorshipStats();

  const sessionStatusData = [
    { name: 'Chờ xác nhận', count: Number(stats.pendingSessions) },
    { name: 'Đã xác nhận', count: Number(stats.confirmedSessions) },
    { name: 'Hoàn thành', count: Number(stats.completedSessions) },
    { name: 'Đã hủy', count: Number(stats.cancelledSessions) },
    { name: 'Từ chối', count: Number(stats.rejectedSessions) },
  ];

  return (
    <AdminSectionPanel
      title="Mentorship"
      subtitle="Trạng thái mentor, phiên tư vấn và phản hồi từ mentee."
    >
      <Stack spacing={3}>
        <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
          <AdminDashboardMetricTile label="Tổng mentor" value={Number(stats.totalMentors).toLocaleString()} />
          <AdminDashboardMetricTile label="Đã duyệt" value={Number(stats.approvedMentors).toLocaleString()} />
          <AdminDashboardMetricTile label="Chờ duyệt" value={Number(stats.pendingMentors).toLocaleString()} />
          <AdminDashboardMetricTile label="Tổng phiên" value={Number(stats.totalSessions).toLocaleString()} />
          <AdminDashboardMetricTile label="Hoàn thành" value={Number(stats.completedSessions).toLocaleString()} />
          <AdminDashboardMetricTile label="Tổng đánh giá" value={Number(stats.totalFeedbacks).toLocaleString()} />
        </Stack>

        <Chart
          type="bar"
          title="Phiên mentorship theo trạng thái"
          data={sessionStatusData}
          dataKey="count"
          xAxisKey="name"
          height={260}
        />
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminMentorshipSection;
