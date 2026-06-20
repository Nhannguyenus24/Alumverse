import { Stack } from '@mui/material';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';
import useAdminFeedbackStats from '../../hooks/admin/useAdminFeedbackStats';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const AdminFeedbackSection = () => {
  const { stats } = useAdminFeedbackStats();

  const fmtDate = (str) => {
    const p = String(str ?? '').slice(0, 10).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}` : str;
  };

  const timelineData = (stats.feedbackTimeline || []).map((d) => ({
    date: fmtDate(d.date), count: Number(d.count ?? 0),
  }));

  return (
    <AdminSectionPanel
      title="Phản hồi trường"
      subtitle="Tổng quan phản hồi từ cựu sinh viên và xu hướng 30 ngày."
    >
      <Stack spacing={3}>
        <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
          <AdminDashboardMetricTile
            label="Tổng phản hồi"
            value={Number(stats.totalFeedbacks).toLocaleString()}
            icon={<FeedbackOutlinedIcon />}
          />
          <AdminDashboardMetricTile
            label="Chưa đọc"
            value={Number(stats.unreadFeedbacks).toLocaleString()}
            icon={<MarkEmailUnreadOutlinedIcon />}
          />
          <AdminDashboardMetricTile
            label="Đã đọc"
            value={Number(stats.readFeedbacks).toLocaleString()}
            icon={<DraftsOutlinedIcon />}
          />
        </Stack>

        <Chart
          type="line"
          title="Phản hồi theo ngày (30 ngày qua)"
          data={timelineData}
          dataKey="count"
          xAxisKey="date"
          height={260}
        />
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminFeedbackSection;
