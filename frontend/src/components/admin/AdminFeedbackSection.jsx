import { Stack } from '@mui/material';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined';
import { useTranslation } from 'react-i18next';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';
import useAdminFeedbackStats from '../../hooks/admin/useAdminFeedbackStats';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const AdminFeedbackSection = ({ from, to }) => {
  const { t } = useTranslation('admin');
  const { stats } = useAdminFeedbackStats(from, to);

  const fmtDate = (str) => {
    const p = String(str ?? '').slice(0, 10).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}` : str;
  };

  const timelineData = (stats.feedbackTimeline || []).map((d) => ({
    date: fmtDate(d.date), count: Number(d.count ?? 0),
  }));

  return (
    <AdminSectionPanel
      title={t('feedback_section_title')}
      subtitle={t('feedback_section_subtitle')}
    >
      <Stack spacing={3}>
        <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
          <AdminDashboardMetricTile
            label={t('feedback_total')}
            value={Number(stats.totalFeedbacks).toLocaleString()}
            icon={<FeedbackOutlinedIcon />}
          />
          <AdminDashboardMetricTile
            label={t('feedback_unread')}
            value={Number(stats.unreadFeedbacks).toLocaleString()}
            icon={<MarkEmailUnreadOutlinedIcon />}
          />
          <AdminDashboardMetricTile
            label={t('feedback_read')}
            value={Number(stats.readFeedbacks).toLocaleString()}
            icon={<DraftsOutlinedIcon />}
          />
        </Stack>

        <Chart
          type="line"
          title={t('feedback_chart_title')}
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
