import { Stack } from '@mui/material';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
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
        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label="Tổng cố vấn" value={Number(stats.totalMentors).toLocaleString()} icon={<SchoolOutlinedIcon />} />
            <AdminDashboardMetricTile label="Cố vấn đã duyệt" value={Number(stats.approvedMentors).toLocaleString()} icon={<VerifiedUserOutlinedIcon />} />
            <AdminDashboardMetricTile label="Cố vấn chờ duyệt" value={Number(stats.pendingMentors).toLocaleString()} icon={<PendingActionsOutlinedIcon />} />
          </Stack>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label="Tổng số phiên" value={Number(stats.totalSessions).toLocaleString()} icon={<EventNoteOutlinedIcon />} />
            <AdminDashboardMetricTile label="Phiên hoàn thành" value={Number(stats.completedSessions).toLocaleString()} icon={<TaskAltOutlinedIcon />} />
            <AdminDashboardMetricTile label="Phản hồi" value={Number(stats.totalFeedbacks).toLocaleString()} icon={<RateReviewOutlinedIcon />} />
          </Stack>
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
